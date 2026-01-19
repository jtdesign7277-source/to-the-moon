# TO THE MOON - Backend API

Production-quality Flask backend for the TO THE MOON trading platform.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Subscriptions**: Stripe integration for $9.99/month Pro tier
- **Strategies**: Create, backtest, and deploy trading strategies
- **Trading**: Paper and live trading with P&L tracking
- **Leaderboard**: Real-time trader rankings
- **Marketplace**: Browse and subscribe to public strategies

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Stripe account (for payments)

### 2. Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your values
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb tothemoon

# Apply schema
psql -d tothemoon -f database/schema.sql

# Or use Flask-Migrate
flask db upgrade
```

### 4. Run Development Server

```bash
python api_server.py

# Or with Flask CLI
flask run --debug
```

Server runs at `http://localhost:5000`

### 5. Initialize Data

```bash
# Create tables
python api_server.py --init-db

# Seed strategy templates
python api_server.py --seed
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/signup     - Register new user
POST /api/auth/login      - Login and get JWT token
POST /api/auth/refresh    - Refresh access token
GET  /api/auth/me         - Get current user
```

### Subscription
```
GET  /api/subscription/status   - Get subscription status
POST /api/subscription/checkout - Create Stripe checkout session
POST /api/subscription/cancel   - Cancel subscription
```

### Strategies (Pro required for create/backtest)
```
GET  /api/strategies              - List strategies
POST /api/strategies              - Create strategy
GET  /api/strategies/:id          - Get strategy
PUT  /api/strategies/:id          - Update strategy
DELETE /api/strategies/:id        - Delete strategy
GET  /api/strategies/templates    - Get pre-built templates
GET  /api/strategies/marketplace  - Browse marketplace
POST /api/strategies/:id/follow   - Follow strategy
POST /api/strategies/backtest     - Run backtest
```

### Trades
```
GET  /api/trades           - List user's trades
POST /api/trades           - Open new trade
GET  /api/trades/:id       - Get trade details
POST /api/trades/:id/close - Close trade
POST /api/trades/:id/cancel - Cancel trade
GET  /api/trades/stats     - Get trading stats
```

### Leaderboard
```
GET /api/leaderboard         - Get rankings
GET /api/leaderboard/my-rank - Get user's rank
```

### Webhooks
```
POST /api/webhook/stripe - Stripe webhook handler
```

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 api_server:app
```

### Environment Variables

Required for production:
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### Docker

```bash
docker build -t tothemoon-api .
docker run -p 5000:5000 --env-file .env tothemoon-api
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=. --cov-report=html
```

## Project Structure

```
backend/
├── api_server.py          # Main Flask application
├── config.py              # Configuration classes
├── requirements.txt       # Python dependencies
├── .env.example           # Environment template
│
├── models/
│   └── __init__.py        # SQLAlchemy models
│
├── routes/
│   ├── __init__.py        # Blueprint registration
│   ├── auth.py            # Authentication routes
│   ├── subscription.py    # Subscription routes
│   ├── strategies.py      # Strategy routes
│   ├── trades.py          # Trade routes
│   ├── leaderboard.py     # Leaderboard routes
│   └── webhook.py         # Stripe webhooks
│
├── services/
│   ├── stripe_service.py  # Stripe integration
│   └── backtest_service.py # Backtesting engine
│
├── utils/
│   └── auth.py            # Auth utilities
│
└── database/
    └── schema.sql         # PostgreSQL schema
```

## License

MIT
