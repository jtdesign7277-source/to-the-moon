"""
TO THE MOON - Database Initialization Script
Creates tables and seeds initial data.
"""
import os
import sys
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from models import db, User, Subscription, Strategy, Trade, LeaderboardSnapshot, StrategyFollow


def create_app():
    """Create Flask application with database configuration."""
    app = Flask(__name__)

    # Database configuration
    database_url = os.environ.get('DATABASE_URL', 'postgresql://localhost/tothemoon')

    # Handle Heroku-style postgres:// URLs
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

    db.init_app(app)

    return app


def init_db(app):
    """Create all database tables."""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Tables created successfully!")


def seed_strategies(app):
    """Seed the 9 pre-built strategy templates."""
    with app.app_context():
        # Check if templates already exist
        existing = Strategy.query.filter_by(is_template=True).count()
        if existing > 0:
            print(f"✓ {existing} strategy templates already exist, skipping seed.")
            return

        print("Seeding strategy templates...")

        templates = [
            {
                'name': 'Conservative Arb Bot',
                'description': 'Low-risk arbitrage with 87% win rate. Minimum 3% edge requirement.',
                'category': 'arbitrage',
                'config': {'risk_level': 'low', 'min_edge': 0.03, 'max_position': 0.05, 'difficulty': 'beginner'},
                'win_rate': 87.0
            },
            {
                'name': 'Sports High Volume',
                'description': 'High-frequency sports betting. 74% win rate, targets volume over edge.',
                'category': 'sports',
                'config': {'risk_level': 'medium', 'min_edge': 0.01, 'max_position': 0.02, 'difficulty': 'intermediate'},
                'win_rate': 74.0
            },
            {
                'name': 'Crypto Volatility Play',
                'description': 'Aggressive crypto strategy. 61% win rate but high returns on wins.',
                'category': 'crypto',
                'config': {'risk_level': 'high', 'min_edge': 0.05, 'max_position': 0.10, 'difficulty': 'advanced'},
                'win_rate': 61.0
            },
            {
                'name': 'Political Momentum',
                'description': 'Event-driven political predictions. 68% win rate on momentum shifts.',
                'category': 'politics',
                'config': {'risk_level': 'medium', 'min_edge': 0.04, 'max_position': 0.05, 'difficulty': 'intermediate'},
                'win_rate': 68.0
            },
            {
                'name': 'Multi-Platform Arb Pro',
                'description': 'Cross-platform arbitrage. 79% win rate exploiting price discrepancies.',
                'category': 'arbitrage',
                'config': {'risk_level': 'medium', 'min_edge': 0.02, 'platforms': ['kalshi', 'polymarket'], 'difficulty': 'advanced'},
                'win_rate': 79.0
            },
            {
                'name': 'Fed News Scalper',
                'description': 'High-precision Fed announcement scalping. 92% win rate, expert level.',
                'category': 'macro',
                'config': {'risk_level': 'high', 'news_sources': ['fed'], 'reaction_time': 'fast', 'difficulty': 'expert'},
                'win_rate': 92.0
            },
            {
                'name': 'Weather Derivatives',
                'description': 'Weather-based prediction markets. 71% win rate, low risk.',
                'category': 'weather',
                'config': {'risk_level': 'low', 'data_sources': ['noaa'], 'difficulty': 'beginner'},
                'win_rate': 71.0
            },
            {
                'name': 'Earnings Momentum',
                'description': 'Trade earnings surprises. 65% win rate on momentum plays.',
                'category': 'earnings',
                'config': {'risk_level': 'medium', 'lookback_quarters': 4, 'difficulty': 'intermediate'},
                'win_rate': 65.0
            },
            {
                'name': 'Market Maker Lite',
                'description': 'Simple market-making for prediction markets. 83% win rate.',
                'category': 'market-making',
                'config': {'risk_level': 'low', 'spread': 0.02, 'inventory_limit': 0.1, 'difficulty': 'advanced'},
                'win_rate': 83.0
            }
        ]

        for t in templates:
            strategy = Strategy(
                user_id=None,
                name=t['name'],
                description=t['description'],
                category=t['category'],
                config=t['config'],
                is_public=True,
                is_template=True,
                win_rate=t['win_rate']
            )
            db.session.add(strategy)

        db.session.commit()
        print(f"✓ Seeded {len(templates)} strategy templates!")


def seed_leaderboard(app):
    """Seed sample leaderboard data."""
    with app.app_context():
        # Check if leaderboard already exists
        existing = LeaderboardSnapshot.query.count()
        if existing > 0:
            print(f"✓ Leaderboard data already exists, skipping seed.")
            return

        print("Seeding leaderboard...")

        rankings = [
            {'rank': 1, 'user_id': None, 'username': 'CryptoKing', 'pnl': 24560.78, 'return_pct': 245.6, 'win_rate': 78, 'trades': 432, 'followers': 1234},
            {'rank': 2, 'user_id': None, 'username': 'AlgoMaster', 'pnl': 19830.50, 'return_pct': 198.3, 'win_rate': 72, 'trades': 651, 'followers': 987},
            {'rank': 3, 'user_id': None, 'username': 'MoonShot', 'pnl': 15670.25, 'return_pct': 156.7, 'win_rate': 69, 'trades': 289, 'followers': 756},
            {'rank': 4, 'user_id': None, 'username': 'TradingBot99', 'pnl': 13420.00, 'return_pct': 134.2, 'win_rate': 65, 'trades': 1203, 'followers': 543},
            {'rank': 5, 'user_id': None, 'username': 'WhaleTrades', 'pnl': 12890.33, 'return_pct': 128.9, 'win_rate': 71, 'trades': 178, 'followers': 421},
            {'rank': 6, 'user_id': None, 'username': 'DiamondHands', 'pnl': 11240.00, 'return_pct': 112.4, 'win_rate': 63, 'trades': 567, 'followers': 387},
            {'rank': 7, 'user_id': None, 'username': 'BullRunner', 'pnl': 9870.50, 'return_pct': 98.7, 'win_rate': 67, 'trades': 345, 'followers': 298},
            {'rank': 8, 'user_id': None, 'username': 'SmartMoney', 'pnl': 8730.25, 'return_pct': 87.3, 'win_rate': 70, 'trades': 234, 'followers': 234}
        ]

        snapshot = LeaderboardSnapshot(
            snapshot_date=datetime.utcnow().date(),
            period='monthly',
            rankings=rankings
        )
        db.session.add(snapshot)
        db.session.commit()
        print("✓ Seeded leaderboard data!")


def drop_all(app):
    """Drop all tables (use with caution!)."""
    with app.app_context():
        print("⚠️  Dropping all tables...")
        db.drop_all()
        print("✓ All tables dropped!")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='TO THE MOON Database Management')
    parser.add_argument('--init', action='store_true', help='Create all tables')
    parser.add_argument('--seed', action='store_true', help='Seed initial data')
    parser.add_argument('--drop', action='store_true', help='Drop all tables (DESTRUCTIVE)')
    parser.add_argument('--reset', action='store_true', help='Drop and recreate all tables (DESTRUCTIVE)')

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
            seed_strategies(app)
            seed_leaderboard(app)
        else:
            print("Aborted.")
            return

    if args.init:
        init_db(app)

    if args.seed:
        seed_strategies(app)
        seed_leaderboard(app)

    if not any([args.init, args.seed, args.drop, args.reset]):
        parser.print_help()
        print("\n" + "=" * 50)
        print("Quick Start:")
        print("  python init_db.py --init --seed")
        print("=" * 50)


if __name__ == '__main__':
    main()
