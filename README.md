# TO THE MOON 🚀

A SaaS trading platform for prediction markets and crypto trading strategies.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Flask](https://img.shields.io/badge/Flask-3.0-black.svg)

## Features

- **Dashboard** - Real-time P&L, portfolio overview, active trades
- **Strategy Builder** - Create and backtest custom trading strategies (Pro)
- **Marketplace** - Browse and follow top-performing strategies
- **Leaderboard** - Top 50 traders ranked by performance
- **Paper & Live Trading** - Practice risk-free or trade with real money
- **Pro Subscription** - $9.99/month for advanced features via Stripe

## Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS v4
- Recharts (charts)
- Lucide React (icons)
- Axios (API client)

### Backend
- Flask (Python 3.11+)
- PostgreSQL
- JWT Authentication (PyJWT + bcrypt)
- Stripe Payments

## Project Structure

```
to-the-moon/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom hooks (useAuth, useSubscription)
│   ├── pages/              # Page components
│   └── utils/              # API client, Stripe utils
│
├── backend/                # Flask backend
│   ├── api_server.py       # Main Flask app
│   ├── models.py           # SQLAlchemy models
│   ├── database/           # SQL schema
│   ├── routes/             # API route blueprints
│   ├── services/           # Business logic
│   └── utils/              # Auth utilities
│
└── public/                 # Static assets
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (optional for dev)

### Frontend

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000" > .env.local

# Start dev server
npm run dev

# Open http://localhost:5173
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your values

# Start server
python api_server.py

# API runs on http://localhost:5000
```

## Environment Variables

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
```

### Backend (.env)
```bash
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
JWT_EXPIRATION_DAYS=30
DATABASE_URL=postgresql://localhost/tothemoon
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
ALLOWED_ORIGINS=http://localhost:5173
```

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | - | Health check |
| `/api/auth/signup` | POST | - | Register user |
| `/api/auth/login` | POST | - | Login, get JWT |
| `/api/auth/me` | GET | JWT | Current user info |
| `/api/subscription/status` | GET | - | Subscription tier |
| `/api/subscription/checkout` | POST | JWT | Stripe checkout |
| `/api/leaderboard` | GET | - | Top 50 traders |
| `/api/strategies` | GET | - | List strategies |
| `/api/strategies` | POST | Pro | Create strategy |
| `/api/backtest` | POST | Pro | Run backtest |
| `/api/trades` | GET | JWT | User's trades |
| `/api/trades` | POST | JWT | Open trade |

## Demo Account

```
Email: demo@example.com
Password: demo123
Tier: Pro (all features unlocked)
```

## Database Setup

```bash
# Create PostgreSQL database
createdb tothemoon

# Apply schema
psql -d tothemoon -f backend/database/schema.sql

# Or use SQLAlchemy
cd backend
python init_db.py --init --seed
```

## Deployment

### Backend (Railway)

```bash
cd backend
railway login
railway init
railway add  # Select PostgreSQL
# Set environment variables in dashboard
railway up
railway domain
```

### Frontend (Vercel)

```bash
npm install -g vercel
vercel
# Set VITE_API_URL to your Railway backend URL
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
