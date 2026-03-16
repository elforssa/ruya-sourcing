#!/bin/bash
# =============================================================================
# Manual Database Backup Script
# Usage: ./scripts/backup-db.sh
# Creates a timestamped SQL dump in the backups/ directory
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

# Load DATABASE_URL from .env.local or .env
if [ -f "$PROJECT_DIR/.env.local" ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$PROJECT_DIR/.env.local" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
elif [ -f "$PROJECT_DIR/.env" ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$PROJECT_DIR/.env" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL not found. Set it in .env.local or .env"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/ruya_${TIMESTAMP}.sql"

echo "🔄 Backing up database..."
echo "   → $BACKUP_FILE"

# Add libpq to PATH if installed via Homebrew (macOS)
if [ -d "/usr/local/opt/libpq/bin" ]; then
  export PATH="/usr/local/opt/libpq/bin:$PATH"
elif [ -d "/opt/homebrew/opt/libpq/bin" ]; then
  export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
fi

# Run pg_dump (strip sslmode and channel_binding for pg_dump compatibility)
CLEAN_URL=$(echo "$DATABASE_URL" | sed 's/[?&]channel_binding=[^&]*//' | sed 's/[?&]sslmode=[^&]*//')
pg_dump "$CLEAN_URL?sslmode=require" --no-owner --no-acl --clean --if-exists > "$BACKUP_FILE"

# Check if backup was created successfully
if [ -s "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup complete! ($SIZE)"
  echo "   File: $BACKUP_FILE"
  echo ""
  echo "   To restore: psql \$DATABASE_URL < $BACKUP_FILE"
else
  echo "❌ Backup failed — file is empty"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Keep only the last 10 backups to save disk space
cd "$BACKUP_DIR"
ls -t ruya_*.sql 2>/dev/null | tail -n +11 | xargs -r rm --
echo "📁 Backups stored: $(ls ruya_*.sql 2>/dev/null | wc -l | tr -d ' ')/10 max"
