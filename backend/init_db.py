"""
TO THE MOON - Database Initialization Script
Creates tables and seeds initial data.
"""
import os
import sys
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from models import (
    db, User, Subscription, UserStats, Strategy, Trade,
    WaitlistEntry, BacktestResult, create_demo_user
)
import bcrypt


def create_app():
    """Create Flask application with database configuration."""
    app = Flask(__name__)

    # Database configuration
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///tothemoon.db')

    # Handle Railway/Heroku-style postgres:// URLs
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

    db.init_app(app)

    return app


def init_db(app):
    """Create all database tables."""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Tables created successfully!")


def seed_demo_user(app):
    """Create demo user with pro subscription."""
    with app.app_context():
        # Check if demo user already exists
        existing = User.query.filter_by(email='demo@example.com').first()
        if existing:
            print("✓ Demo user already exists, skipping.")
            return

        print("Creating demo user...")
        create_demo_user()
        print("✓ Demo user created (demo@example.com / demo123)")


def seed_strategies(app):
    """Seed the 9 pre-built strategy templates."""
    with app.app_context():
        # Check if templates already exist
        existing = Strategy.query.filter(Strategy.user_id == None).count()
        if existing > 0:
            print(f"✓ {existing} strategy templates already exist, skipping seed.")
            return

        print("Seeding strategy templates...")

        templates = [
            {
                'name': 'Conservative Arb Bot',
                'description': 'Low-risk arbitrage with 87% win rate. Minimum 3% edge requirement.',
                'category': 'arbitrage',
                'risk_profile': 'low',
                'difficulty': 'beginner',
                'config': {'min_edge': 0.03, 'max_position_size': 0.05},
            },
            {
                'name': 'Sports High Volume',
                'description': 'High-frequency sports betting. 74% win rate, targets volume over edge.',
                'category': 'sports',
                'risk_profile': 'moderate',
                'difficulty': 'intermediate',
                'config': {'min_edge': 0.01, 'max_position_size': 0.02},
            },
            {
                'name': 'Crypto Volatility Play',
                'description': 'Aggressive crypto strategy. 61% win rate but high returns on wins.',
                'category': 'crypto',
                'risk_profile': 'high',
                'difficulty': 'advanced',
                'config': {'min_edge': 0.05, 'max_position_size': 0.10},
            },
            {
                'name': 'Political Momentum',
                'description': 'Event-driven political predictions. 68% win rate on momentum shifts.',
                'category': 'politics',
                'risk_profile': 'moderate',
                'difficulty': 'intermediate',
                'config': {'min_edge': 0.04, 'max_position_size': 0.05},
            },
            {
                'name': 'Multi-Platform Arb Pro',
                'description': 'Cross-platform arbitrage. 79% win rate exploiting price discrepancies.',
                'category': 'arbitrage',
                'risk_profile': 'moderate',
                'difficulty': 'advanced',
                'config': {'min_edge': 0.02, 'platforms': ['kalshi', 'polymarket']},
            },
            {
                'name': 'Fed News Scalper',
                'description': 'High-precision Fed announcement scalping. 92% win rate, expert level.',
                'category': 'macro',
                'risk_profile': 'high',
                'difficulty': 'advanced',
                'config': {'news_sources': ['fed'], 'reaction_time': 'fast'},
            },
            {
                'name': 'Weather Derivatives',
                'description': 'Weather-based prediction markets. 71% win rate, low risk.',
                'category': 'weather',
                'risk_profile': 'low',
                'difficulty': 'beginner',
                'config': {'data_sources': ['noaa']},
            },
            {
                'name': 'Earnings Momentum',
                'description': 'Trade earnings surprises. 65% win rate on momentum plays.',
                'category': 'earnings',
                'risk_profile': 'moderate',
                'difficulty': 'intermediate',
                'config': {'lookback_quarters': 4},
            },
            {
                'name': 'Market Maker Lite',
                'description': 'Simple market-making for prediction markets. 83% win rate.',
                'category': 'market-making',
                'risk_profile': 'low',
                'difficulty': 'advanced',
                'config': {'spread': 0.02, 'inventory_limit': 0.1},
            }
        ]

        for t in templates:
            strategy = Strategy(
                user_id=None,  # Template (no owner)
                name=t['name'],
                description=t['description'],
                category=t['category'],
                risk_profile=t['risk_profile'],
                difficulty=t['difficulty'],
                config=t['config'],
                is_public=True,
            )
            db.session.add(strategy)

        db.session.commit()
        print(f"✓ Seeded {len(templates)} strategy templates!")


def drop_all(app):
    """Drop all tables (use with caution!)."""
    with app.app_context():
        print("⚠️  Dropping all tables...")
        db.drop_all()
        print("✓ All tables dropped!")


def show_stats(app):
    """Show database statistics."""
    with app.app_context():
        print("\n📊 Database Statistics:")
        print(f"   Users: {User.query.count()}")
        print(f"   Subscriptions: {Subscription.query.count()}")
        print(f"   Strategies: {Strategy.query.count()}")
        print(f"   Trades: {Trade.query.count()}")
        print(f"   Waitlist: {WaitlistEntry.query.count()}")
        print(f"   Backtests: {BacktestResult.query.count()}")
        print("")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='TO THE MOON Database Management')
    parser.add_argument('--init', action='store_true', help='Create all tables')
    parser.add_argument('--seed', action='store_true', help='Seed initial data (demo user + strategies)')
    parser.add_argument('--drop', action='store_true', help='Drop all tables (DESTRUCTIVE)')
    parser.add_argument('--reset', action='store_true', help='Drop and recreate all tables (DESTRUCTIVE)')
    parser.add_argument('--stats', action='store_true', help='Show database statistics')

    args = parser.parse_args()

    app = create_app()

    if args.drop:
        confirm = input("⚠️  This will DELETE all data. Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            drop_all(app)
        else:
            print("Aborted.")
            return

    if args.reset:
        confirm = input("⚠️  This will DELETE all data and recreate tables. Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            drop_all(app)
            init_db(app)
            seed_demo_user(app)
            seed_strategies(app)
        else:
            print("Aborted.")
            return

    if args.init:
        init_db(app)

    if args.seed:
        seed_demo_user(app)
        seed_strategies(app)

    if args.stats:
        show_stats(app)

    if not any([args.init, args.seed, args.drop, args.reset, args.stats]):
        parser.print_help()
        print("\n" + "=" * 50)
        print("Quick Start:")
        print("  python init_db.py --init --seed")
        print("")
        print("Show stats:")
        print("  python init_db.py --stats")
        print("=" * 50)


if __name__ == '__main__':
    main()
