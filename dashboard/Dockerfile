# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app/dashboard

COPY package*.json ./
RUN npm install

COPY . .

# Set environment variable for build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/dashboard/public ./public
COPY --from=builder /app/dashboard/.next/standalone ./
COPY --from=builder /app/dashboard/.next/static ./.next/static

EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
