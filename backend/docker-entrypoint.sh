#!/bin/sh
set -e

mkdir -p /data/labels /data/uploads

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Seeding database..."
  node dist/seed/seed.js
fi

echo "Starting Diyanara API..."
exec node dist/main
