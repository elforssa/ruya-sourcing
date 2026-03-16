#!/bin/bash
# =============================================================================
# Safe Migration Script
# Usage: ./scripts/safe-migrate.sh
# Backs up the database FIRST, then runs prisma migrate deploy (production-safe)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "================================================"
echo "  SAFE MIGRATION — backup first, then migrate"
echo "================================================"
echo ""

# Step 1: Backup
echo "Step 1/3: Creating backup..."
bash "$SCRIPT_DIR/backup-db.sh"
echo ""

# Step 2: Run prisma migrate deploy (NEVER migrate dev on production!)
echo "Step 2/3: Applying migrations (prisma migrate deploy)..."
cd "$PROJECT_DIR"
npx prisma migrate deploy

echo ""
echo "Step 3/3: Regenerating Prisma client..."
npx prisma generate

echo ""
echo "================================================"
echo "  ✅ Migration complete — backup saved in backups/"
echo "================================================"
