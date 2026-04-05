#!/bin/bash
# ============================================================
# MongoDB Restore Script
# Extracts a backup archive and runs mongorestore
# Usage: ./restore.sh <backup-file.tar.gz> [--drop]
# ============================================================

set -euo pipefail

# --- Load environment ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

# --- Configuration ---
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
MONGO_DB_NAME="${MONGO_DB_NAME:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# --- Arguments ---
BACKUP_FILE="${1:-}"
DROP_FLAG="${2:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.tar.gz> [--drop]"
  echo ""
  echo "Options:"
  echo "  --drop    Drop existing collections before restoring"
  echo ""
  echo "Available backups:"
  ls -lh "${BACKUP_DIR}"/backup-*.tar.gz 2>/dev/null || echo "  No backups found in ${BACKUP_DIR}"
  exit 1
fi

# Resolve relative paths
if [[ ! "$BACKUP_FILE" = /* ]]; then
  BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# --- Helpers ---
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# --- Main ---
log "🔄 Starting MongoDB restore..."
log "📁 Backup file: ${BACKUP_FILE}"

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d "${BACKUP_DIR}/restore-XXXXXX")
trap 'rm -rf "$TEMP_DIR"' EXIT

# Extract
log "📦 Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the dump directory (should be backup-YYYY-MM-DD_HH-MM-SS)
DUMP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -mindepth 1 -type d | head -1)

if [ -z "$DUMP_DIR" ]; then
  log "❌ No dump directory found in archive!"
  exit 1
fi

log "📂 Dump directory: ${DUMP_DIR}"

# Build restore command
RESTORE_ARGS="--uri=\"${MONGO_URI}\""

if [ -n "$MONGO_DB_NAME" ]; then
  RESTORE_ARGS="${RESTORE_ARGS} --db=\"${MONGO_DB_NAME}\" \"${DUMP_DIR}/${MONGO_DB_NAME}\""
else
  RESTORE_ARGS="${RESTORE_ARGS} \"${DUMP_DIR}\""
fi

if [ "$DROP_FLAG" = "--drop" ]; then
  RESTORE_ARGS="${RESTORE_ARGS} --drop"
  log "⚠️  Drop mode enabled — existing collections will be dropped!"
fi

# Confirmation
echo ""
echo "========================================"
echo "  RESTORE CONFIRMATION"
echo "========================================"
echo "  File:     $(basename "$BACKUP_FILE")"
echo "  Database: ${MONGO_DB_NAME:-all databases}"
echo "  Drop:     ${DROP_FLAG:-no}"
echo "========================================"
echo ""

if [ -t 0 ]; then
  read -p "Proceed with restore? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    log "❌ Restore cancelled by user"
    exit 0
  fi
fi

# Run mongorestore
log "🔄 Running mongorestore..."
if eval mongorestore $RESTORE_ARGS 2>&1; then
  log "✅ Restore completed successfully!"
else
  log "❌ Restore FAILED!"
  exit 1
fi
