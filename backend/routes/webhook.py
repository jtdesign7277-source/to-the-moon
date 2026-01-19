"""
Webhook routes for TO THE MOON (Stripe webhooks).
"""
from flask import Blueprint, request, jsonify, current_app
from services.stripe_service import StripeService

webhook_bp = Blueprint('webhook', __name__)


@webhook_bp.route('/stripe', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events."""
    payload = request.get_data()
    signature = request.headers.get('Stripe-Signature')

    if not signature:
        current_app.logger.error('No Stripe signature in webhook request')
        return jsonify({'error': 'No signature'}), 400

    try:
        event = StripeService.verify_webhook_signature(payload, signature)
    except ValueError as e:
        current_app.logger.error(f'Webhook signature verification failed: {e}')
        return jsonify({'error': str(e)}), 400

    event_type = event['type']
    data = event['data']['object']

    current_app.logger.info(f'Received Stripe webhook: {event_type}')

    try:
        # Handle different event types
        if event_type == 'checkout.session.completed':
            StripeService.handle_checkout_completed(data)

        elif event_type == 'customer.subscription.updated':
            StripeService.handle_subscription_updated(data)

        elif event_type == 'customer.subscription.deleted':
            StripeService.handle_subscription_deleted(data)

        elif event_type == 'invoice.payment_failed':
            StripeService.handle_invoice_payment_failed(data)

        elif event_type == 'invoice.payment_succeeded':
            current_app.logger.info(f'Payment succeeded for invoice {data.get("id")}')

        else:
            current_app.logger.info(f'Unhandled webhook event type: {event_type}')

        return jsonify({'received': True}), 200

    except Exception as e:
        current_app.logger.error(f'Webhook handler error: {e}')
        # Return 200 to acknowledge receipt (Stripe will retry on failure)
        return jsonify({'received': True, 'error': str(e)}), 200
