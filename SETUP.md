# To The Moon - Setup Instructions

> **IMPORTANT:** Read this file FIRST before making any changes to the project.

## Quick Start

```bash
# Terminal 1 - Backend
cd backend && source ../.venv/bin/activate && python api_server.py

# Terminal 2 - Frontend
npm run dev
```

---

## Port Configuration

| Service  | Port | URL |
|----------|------|-----|
| Backend  | **5000** | http://localhost:5000 |
| Frontend | **5173** | http://localhost:5173 |

### ⚠️ CRITICAL: Backend runs on port 5000, NEVER 5001

If you see `5001` anywhere in the codebase, it's WRONG. Fix it immediately.

---

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
```

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=your-secret-key
CREDENTIALS_ENCRYPTION_KEY=your-fernet-key
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
```

---

## API Configuration

### Frontend API Base URL
File: `src/utils/api.js`
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

File: `src/services/marketDataFetcher.js`
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## Kalshi Integration

### Authentication Method
- **Uses RSA-PSS signatures** (NOT HMAC-SHA256)
- Private key format: PEM (multi-line, starts with `-----BEGIN RSA PRIVATE KEY-----`)

### API Credentials Format
1. **API Key ID**: UUID format (e.g., `ab1ed02f-24c4-4a81-aef0-c411cf939762`)
2. **RSA Private Key**: Full PEM format including headers
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEowIBAAKCAQEA...
   (multiple lines of base64)
   -----END RSA PRIVATE KEY-----
   ```

### Kalshi API Endpoints
- Production: `https://api.elections.kalshi.com/trade-api/v2`
- Demo: `https://demo-api.kalshi.co/trade-api/v2`

### Signature Generation
```python
# Message format: timestamp_ms + HTTP_METHOD + path_without_query
message = f"{timestamp}{method.upper()}{path_without_query}"
# Sign with RSA-PSS using SHA256
```

### Documentation
- Official docs: https://docs.kalshi.com/getting_started/api_keys
- Starter code: https://github.com/Kalshi/kalshi-starter-code-python

---

## Database

### Local Development (SQLite)
- Auto-creates `instance/trading.db`
- Tables created via SQLAlchemy models

### Production (PostgreSQL)
- Set `DATABASE_URL` environment variable
- Railway provides this automatically

### Key Models
- `User` - User accounts
- `Trade` - Trade history
- `Strategy` - Trading strategies
- `ConnectedAccount` - Platform API credentials (encrypted)
- `PaperPortfolio` - Paper trading portfolios

---

## Common Issues & Fixes

### "Connection refused" errors
1. Check backend is running on port 5000
2. Verify `VITE_API_URL=http://localhost:5000` in `.env.local`
3. Check for CORS issues in browser console

### "Invalid API credentials" for Kalshi
1. Ensure you're pasting the FULL RSA private key (including headers)
2. Generate a new API key if you lost the private key
3. Check if using demo vs production credentials

### Database "no such column" errors
1. Delete `instance/trading.db` (local dev only)
2. Restart backend to recreate tables
3. Or run migration if using Flask-Migrate

### Frontend not updating
1. Hard refresh: Cmd+Shift+R
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart dev server

---

## Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- Framer Motion
- Lucide Icons

### Backend
- Flask 3.0
- SQLAlchemy 2.0
- Flask-JWT-Extended
- Cryptography (for RSA signatures)

### Deployment
- Frontend: Vercel
- Backend: Railway

---

## Last Updated
- **Date:** January 20, 2026
- **Kalshi API:** RSA-PSS authentication (updated from HMAC)
- **Backend Port:** 5000 (confirmed)
