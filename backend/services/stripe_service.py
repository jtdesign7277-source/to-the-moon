"""
Stripe payment service for TO THE MOON.
"""
import stripe
from datetime import datetime
from flask import current_app
from models import db, User, Subscription


class StripeService:
    """Service for handling Stripe payments."""

    @staticmethod
    def init_stripe():
        """Initialize Stripe with API key."""
        stripe.api_key = current_app.config['STRIPE_SECRET_KEY']

    @staticmethod
    def create_customer(user: User) -> str:
        """Create a Stripe customer for a user."""
        StripeService.init_stripe()

        customer = stripe.Customer.create(
            email=user.email,
            metadata={
                'user_id': str(user.id),
                'username': user.username,
            }
        )

        user.stripe_customer_id = customer.id
        db.session.commit()

        return customer.id

    @staticmethod
    def create_checkout_session(user: User, success_url: str, cancel_url: str) -> dict:
        """Create a Stripe checkout session for Pro subscription."""
        StripeService.init_stripe()

        # Create customer if doesn't exist
        if not user.stripe_customer_id:
            StripeService.create_customer(user)

        price_id = current_app.config['STRIPE_PRICE_ID']

        if not price_id:
            raise ValueError('STRIPE_PRICE_ID not configured')

        session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'user_id': str(user.id),
            },
            subscription_data={
                'metadata': {
                    'user_id': str(user.id),
                },
                'trial_period_days': 7,  # 7-day free trial
            },
        )

        return {
            'session_id': session.id,
            'url': session.url,
        }

    @staticmethod
    def handle_checkout_completed(session: dict):
        """Handle checkout.session.completed webhook event."""
        user_id = session.get('metadata', {}).get('user_id')
        subscription_id = session.get('subscription')
        customer_id = session.get('customer')

        if not user_id:
            current_app.logger.error('No user_id in checkout session metadata')
            return

        user = User.query.get(int(user_id))
        if not user:
            current_app.logger.error(f'User {user_id} not found')
            return

        # Update user's Stripe customer ID if needed
        if not user.stripe_customer_id:
            user.stripe_customer_id = customer_id

        # Get subscription details from Stripe
        StripeService.init_stripe()
        stripe_sub = stripe.Subscription.retrieve(subscription_id)

        # Create or update subscription
        subscription = Subscription.query.filter_by(user_id=user.id).first()

        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.session.add(subscription)

        subscription.tier = 'pro'
        subscription.stripe_subscription_id = subscription_id
        subscription.stripe_price_id = stripe_sub['items']['data'][0]['price']['id']
        subscription.status = 'active'
        subscription.current_period_start = datetime.fromtimestamp(stripe_sub['current_period_start'])
        subscription.current_period_end = datetime.fromtimestamp(stripe_sub['current_period_end'])
        subscription.cancelled_at = None

        db.session.commit()
        current_app.logger.info(f'User {user_id} upgraded to Pro')

    @staticmethod
    def handle_subscription_updated(subscription_data: dict):
        """Handle customer.subscription.updated webhook event."""
        subscription_id = subscription_data.get('id')
        status = subscription_data.get('status')
        cancel_at_period_end = subscription_data.get('cancel_at_period_end', False)

        subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()

        if not subscription:
            current_app.logger.error(f'Subscription {subscription_id} not found')
            return

        # Update subscription status
        subscription.status = status
        subscription.current_period_start = datetime.fromtimestamp(
            subscription_data['current_period_start']
        )
        subscription.current_period_end = datetime.fromtimestamp(
            subscription_data['current_period_end']
        )

        if cancel_at_period_end:
            subscription.cancelled_at = datetime.utcnow()
        else:
            subscription.cancelled_at = None

        db.session.commit()
        current_app.logger.info(f'Subscription {subscription_id} updated: {status}')

    @staticmethod
    def handle_subscription_deleted(subscription_data: dict):
        """Handle customer.subscription.deleted webhook event."""
        subscription_id = subscription_data.get('id')

        subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()

        if not subscription:
            current_app.logger.error(f'Subscription {subscription_id} not found')
            return

        # Downgrade to free tier
        subscription.tier = 'free'
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.utcnow()

        db.session.commit()
        current_app.logger.info(f'Subscription {subscription_id} cancelled')

    @staticmethod
    def handle_invoice_payment_failed(invoice: dict):
        """Handle invoice.payment_failed webhook event."""
        subscription_id = invoice.get('subscription')

        if not subscription_id:
            return

        subscription = Subscription.query.filter_by(
            stripe_subscription_id=subscription_id
        ).first()

        if subscription:
            subscription.status = 'past_due'
            db.session.commit()
            current_app.logger.warning(f'Payment failed for subscription {subscription_id}')

    @staticmethod
    def cancel_subscription(user: User) -> dict:
        """Cancel a user's subscription at period end."""
        subscription = Subscription.query.filter_by(user_id=user.id).first()

        if not subscription or not subscription.stripe_subscription_id:
            return {'success': False, 'message': 'No active subscription found'}

        StripeService.init_stripe()

        try:
            # Cancel at period end (user keeps access until end of billing period)
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )

            subscription.cancelled_at = datetime.utcnow()
            db.session.commit()

            return {
                'success': True,
                'message': 'Subscription will be cancelled at end of billing period',
                'expires_at': subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            }

        except stripe.error.StripeError as e:
            current_app.logger.error(f'Stripe error cancelling subscription: {e}')
            return {'success': False, 'message': 'Failed to cancel subscription'}

    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> dict:
        """Verify Stripe webhook signature and return event."""
        StripeService.init_stripe()
        webhook_secret = current_app.config['STRIPE_WEBHOOK_SECRET']

        try:
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
            return event
        except ValueError:
            raise ValueError('Invalid payload')
        except stripe.error.SignatureVerificationError:
            raise ValueError('Invalid signature')
