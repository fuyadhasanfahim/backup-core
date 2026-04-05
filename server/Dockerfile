# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source
COPY server/. .

# Generate Prisma Client and build
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install system dependencies for backup engine
# - gnupg, curl: for adding repositories
# - rclone: for cloud sync
# - mongodb-database-tools: provides mongodump
RUN apt-get update && apt-get install -y \
    gnupg \
    curl \
    ca-certificates \
    rclone \
    bash \
    openssl \
    && curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor \
    && echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
       tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update && apt-get install -y mongodb-database-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy built app and production dependencies
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

# Copy scripts
COPY scripts ./scripts
RUN chmod +x scripts/*.sh

# Create backup directory
RUN mkdir -p /backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV BACKUP_DIR=/backups

# Expose port
EXPOSE 4000

# Start command
CMD ["node", "server/dist/index.js"]
