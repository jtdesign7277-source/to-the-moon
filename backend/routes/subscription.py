"""
Subscription routes for TO THE MOON.
"""
from flask import Blueprint, request, jsonify, g, current_app
from models import db, Subscription
from utils.auth import jwt_required_custom
from services.stripe_service import StripeService

subscription_bp = Blueprint('subscription', __name__)


@subscription_bp.route('/status', methods=['GET'])
@jwt_required_custom
def get_subscription_status():
    """Get current user's subscription status."""
    try:
        user = g.current_user
        subscription = Subscription.query.filter_by(user_id=user.id).first()

        if not subscription:
            # Create free subscription if none exists
            subscription = Subscription(
                user_id=user.id,
                tier='free',
                status='active',
            )
            db.session.add(subscription)
            db.session.commit()

        # Define features by tier
        free_features = [
            'dashboard',
            'accounts',
            'leaderboard',
            'marketplace-browse',
            'paper-trading',
            'strategy-builder',
            'backtesting',
        ]

        pro_features = free_features + [
            'live-trading',
            'advanced-analytics',
            'priority-support',
            'api-access',
            'custom-alerts',
            'multi-platform-arb',
        ]

        features = pro_features if subscription.is_pro else free_features

        return jsonify({
            'tier': subscription.tier,
            'status': subscription.status,
            'is_pro': subscription.is_pro,
            'features': features,
            'current_period_start': subscription.current_period_start.isoformat() if subscription.current_period_start else None,
            'current_period_end': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            'cancelled_at': subscription.cancelled_at.isoformat() if subscription.cancelled_at else None,
            'price': current_app.config['PRO_PRICE_MONTHLY'],
            'billing_cycle': 'monthly',
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get subscription status: {str(e)}'}), 500


@subscription_bp.route('/checkout', methods=['POST'])
@jwt_required_custom
def create_checkout():
    """Create a Stripe checkout session for Pro upgrade."""
    try:
        user = g.current_user
        data = request.get_json() or {}

        # Get URLs from request or use defaults
        success_url = data.get('success_url', 'http://localhost:5173/?upgrade=success')
        cancel_url = data.get('cancel_url', 'http://localhost:5173/?upgrade=cancelled')

        # Check if already Pro
        subscription = Subscription.query.filter_by(user_id=user.id).first()
        if subscription and subscription.is_pro:
            return jsonify({
                'error': 'Already subscribed to Pro',
                'code': 'ALREADY_PRO',
            }), 400

        # Create checkout session
        result = StripeService.create_checkout_session(
            user=user,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        return jsonify({
            'success': True,
            'session_id': result['session_id'],
            'url': result['url'],
        }), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Checkout error: {e}')
        return jsonify({'error': 'Failed to create checkout session'}), 500


@subscription_bp.route('/cancel', methods=['POST'])
@jwt_required_custom
def cancel_subscription():
    """Cancel user's Pro subscription."""
    try:
        user = g.current_user
        result = StripeService.cancel_subscription(user)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify({'error': f'Failed to cancel subscription: {str(e)}'}), 500


@subscription_bp.route('/upgrade', methods=['POST'])
@jwt_required_custom
def upgrade_subscription():
    """
    Direct upgrade endpoint (for testing/demo purposes).
    In production, upgrades should go through Stripe checkout.
    """
    try:
        user = g.current_user

        # Only allow in development
        if not current_app.config['DEBUG']:
            return jsonify({
                'error': 'Direct upgrade not available. Use checkout flow.',
                'code': 'USE_CHECKOUT',
            }), 400

        subscription = Subscription.query.filter_by(user_id=user.id).first()

        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.session.add(subscription)

        subscription.tier = 'pro'
        subscription.status = 'active'
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Upgraded to Pro (dev mode)',
            'subscription': subscription.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Upgrade failed: {str(e)}'}), 500
