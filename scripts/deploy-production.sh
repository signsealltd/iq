#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/var/www/vhosts/sign-seal.co.uk/iq.sign-seal.co.uk"
NODE_BIN="/root/.nvm/versions/node/v22.23.1/bin"
PM2_APP="signseal-iq"
BRANCH="main"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf '\nDeployment stopped: %s\n' "$*" >&2
  exit 1
}

export PATH="$NODE_BIN:$PATH"
cd "$APP_DIR"

log "Marking repository as a safe Git directory if required"
git config --global --add safe.directory "$APP_DIR" || true

log "Fetching origin/$BRANCH"
git fetch origin "$BRANCH"

log "Resetting working tree to origin/$BRANCH"
git reset --hard "origin/$BRANCH"

log "Installing production dependencies"
npm ci

log "Generating Prisma client"
npx prisma generate

if compgen -G "prisma/migrations/*/migration.sql" > /dev/null; then
  log "Applying Prisma migrations"
  npx prisma migrate deploy
else
  fail "No Prisma migration files found. Baseline the existing production database before deploying schema changes. Do not run migrate reset in production."
fi

log "Building Next.js standalone output"
npm run build

log "Copying static assets into standalone output"
mkdir -p .next/standalone/.next/static
cp -R .next/static/. .next/standalone/.next/static/
mkdir -p .next/standalone/public
cp -R public/. .next/standalone/public/

log "Restarting PM2 app: $PM2_APP"
pm2 restart "$PM2_APP" --update-env

log "Saving PM2 process list"
pm2 save

log "Deployment complete"