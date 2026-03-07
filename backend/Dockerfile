# ── Build stage ────────────────────────────────────────────────
FROM python:3.11-slim AS base

# Prevent Python from buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run injects PORT at runtime — do NOT hardcode it here
EXPOSE 8080

# Production entrypoint – gunicorn with uvicorn workers
# --forwarded-allow-ips='*' tells gunicorn/uvicorn to trust X-Forwarded-Proto
# from the Cloud Run load balancer so HTTPS redirects (307s) use https:// not http://
CMD exec gunicorn \
    --bind 0.0.0.0:${PORT} \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --forwarded-allow-ips='*' \
    app.main:app
