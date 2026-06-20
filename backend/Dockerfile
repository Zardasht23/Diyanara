# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma engines on Alpine require OpenSSL 3.x at build time
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Drop devDependencies; prisma stays (production dependency)
RUN npm prune --omit=dev

# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# openssl: required by Prisma query/migration engines on Alpine (OpenSSL 3.x)
RUN apk add --no-cache curl openssl

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --chown=node:node docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

ENV DATA_DIR=/data
ENV LABELS_DIR=/data/labels
ENV UPLOADS_DIR=/data/uploads
ENV PORT=3001

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
