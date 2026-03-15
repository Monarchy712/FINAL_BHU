# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# This will output to ../dist based on updated vite.config.ts
RUN npm run build

# Stage 2: Final image with Python backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 1. Copy legacy frontend
COPY globe/frontend /app/globe/frontend

# 2. Set up Python backend
WORKDIR /app/globe/backend
COPY globe/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY globe/backend/ ./

# 3. Copy built React frontend
COPY --from=frontend-builder /app/dist /app/dist

# Expose the port
EXPOSE 8000

# Start command (using string form to allow shell variable substitution)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
