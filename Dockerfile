# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# This will output to ../globe/frontend based on vite.config.ts
RUN npm run build

# Stage 2: Final image with Python backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if needed (e.g. for numpy/pandas)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up Python backend
WORKDIR /app/globe/backend
COPY globe/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY globe/backend/ ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/globe/frontend /app/globe/frontend

# Expose the port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
