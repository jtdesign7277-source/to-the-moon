"""
API routes for TO THE MOON.
"""
from routes.auth import auth_bp
from routes.subscription import subscription_bp
from routes.strategies import strategies_bp
from routes.trades import trades_bp
from routes.leaderboard import leaderboard_bp
from routes.webhook import webhook_bp


def register_routes(app):
    """Register all blueprints with the Flask app."""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
    app.register_blueprint(strategies_bp, url_prefix='/api/strategies')
    app.register_blueprint(trades_bp, url_prefix='/api/trades')
    app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
    app.register_blueprint(webhook_bp, url_prefix='/api/webhook')
