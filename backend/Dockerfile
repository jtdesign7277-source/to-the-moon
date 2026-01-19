# ============================================
# TO THE MOON - Backend Dockerfile
# ============================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port (Railway provides PORT env var)
EXPOSE ${PORT:-5000}

# Run with gunicorn using Railway's PORT
CMD gunicorn -w 2 -b 0.0.0.0:${PORT:-5000} --access-logfile - --error-logfile - api_server:app
