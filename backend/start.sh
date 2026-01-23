#!/bin/sh
echo "Running database initialization and migrations..."
python init_db.py --init --migrate || echo "Migration warning (may be ok if tables exist)"
echo "Starting server..."
exec gunicorn -w 2 -b 0.0.0.0:${PORT:-5000} --access-logfile - --error-logfile - api_server:app
