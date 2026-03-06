# ============================================================================
# Dockerfile — Dashboard Service
# Relays real-time events via WebSocket and proxies REST APIs.
# ============================================================================
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ ./app/

# Run the FastAPI service on port 8002
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--log-level", "info"]
