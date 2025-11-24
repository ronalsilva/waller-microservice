#!/bin/sh

set -e

echo "Waiting for database to be ready..."
sleep 3

echo "Running Prisma db push to create/update database schema..."
npx prisma db push --accept-data-loss || {
  echo "Warning: prisma db push had issues, but continuing..."
}

echo "Starting application..."
exec npm run dev

