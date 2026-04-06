#!/bin/bash
# ============================================================
# MongoDB Backup Script
# Performs mongodump, compresses, cleans old backups,
# uploads to Nextcloud via rclone, and logs result to API.
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
RETENTION_DAYS="${RETENTION_DAYS:-7}"
API_URL="${API_URL:-http://localhost:4000}"
API_KEY="${API_KEY:-}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
RCLONE_PATH="${RCLONE_PATH:-backups/}"

# --- Timestamp ---
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BACKUP_NAME="backup-${TIMESTAMP}"
DUMP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
ARCHIVE_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# --- Helpers ---
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_to_api() {
  local status="$1"
  local size="$2"
  local duration="$3"
  local error_msg="${4:-}"
  local file_path="${5:-}"
  local cloud_sync="${6:-false}"
  local backup_id="${BACKUP_ID:-}"

  if [ -n "$API_KEY" ]; then
    curl -s -X POST "${API_URL}/api/backups/log" \
      -H "Content-Type: application/json" \
      -H "x-api-key: ${API_KEY}" \
      -d "{
        \"id\": \"${backup_id}\",
        \"date\": \"${DATE_ISO}\",
        \"dbName\": \"${MONGO_DB_NAME:-all}\",
        \"size\": \"${size}\",
        \"status\": \"${status}\",
        \"filePath\": \"${file_path}\",
        \"duration\": ${duration},
        \"cloudSync\": ${cloud_sync},
        \"errorMsg\": \"${error_msg}\"
      }" > /dev/null 2>&1 || true
  fi
}

get_file_size() {
  local file="$1"
  if [ -f "$file" ]; then
    local bytes
    bytes=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
    if [ "$bytes" -ge 1073741824 ]; then
      echo "$bytes" | awk '{printf "%.2f GB", $1/1073741824}'
    elif [ "$bytes" -ge 1048576 ]; then
      echo "$bytes" | awk '{printf "%.2f MB", $1/1048576}'
    elif [ "$bytes" -ge 1024 ]; then
      echo "$bytes" | awk '{printf "%.2f KB", $1/1024}'
    else
      echo "${bytes} B"
    fi
  else
    echo "0 B"
  fi
}

# --- Main ---
main() {
  local start_time
  start_time=$(date +%s)

  log "🚀 Starting MongoDB backup..."
  log "Database: ${MONGO_DB_NAME:-all databases}"
  log "Output: ${ARCHIVE_FILE}"

  # Ensure backup directory exists
  mkdir -p "$BACKUP_DIR"

  # --- Step 1: mongodump ---
  log "📦 Running mongodump..."
  
  # Use array for arguments to handle special characters correctly without eval
  DUMP_ARGS=("--uri=${MONGO_URI}" "--out=${DUMP_DIR}")
  
  if [ -n "$MONGO_DB_NAME" ]; then
    DUMP_ARGS+=("--db=${MONGO_DB_NAME}")
  fi

  log "Executing: mongodump ${DUMP_ARGS[*]}"

  if ! mongodump "${DUMP_ARGS[@]}" 2>&1; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "❌ mongodump FAILED!"
    log_to_api "failed" "0 B" "$duration" "mongodump failed" "" "false"
    
    # Cleanup failed dump
    rm -rf "$DUMP_DIR" 2>/dev/null || true
    exit 1
  fi

  log "✅ mongodump completed"

  # --- Step 2: Compress ---
  log "🗜️  Compressing backup..."
  
  if ! tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$BACKUP_NAME" 2>&1; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "❌ Compression FAILED!"
    log_to_api "failed" "0 B" "$duration" "compression failed" "" "false"
    
    rm -rf "$DUMP_DIR" 2>/dev/null || true
    exit 1
  fi

  # Remove raw dump directory (keep only archive)
  rm -rf "$DUMP_DIR"
  
  local file_size
  file_size=$(get_file_size "$ARCHIVE_FILE")
  log "✅ Compressed: ${file_size}"

  # --- Step 3: Upload to Nextcloud ---
  local cloud_sync="false"
  
  if [ -n "$RCLONE_REMOTE" ]; then
    log "☁️  Uploading to Nextcloud..."
    if rclone copy "$ARCHIVE_FILE" "${RCLONE_REMOTE}:${RCLONE_PATH}" --progress 2>&1; then
      cloud_sync="true"
      log "✅ Nextcloud upload complete"
    else
      log "⚠️  Nextcloud upload failed (backup still saved locally)"
    fi
  fi

  # --- Step 4: Clean old backups ---
  log "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
  
  local deleted_count=0
  while IFS= read -r -d '' old_backup; do
    rm -f "$old_backup"
    deleted_count=$((deleted_count + 1))
    log "  Deleted: $(basename "$old_backup")"
  done < <(find "$BACKUP_DIR" -name "backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
  
  log "  Cleaned ${deleted_count} old backup(s)"

  # --- Done ---
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "✅ Backup completed successfully!"
  log "  📁 File: ${ARCHIVE_FILE}"
  log "  📊 Size: ${file_size}"
  log "  ⏱  Duration: ${duration}s"
  log "  ☁️  Cloud: ${cloud_sync}"

  # Log to API
  log_to_api "success" "$file_size" "$duration" "" "$ARCHIVE_FILE" "$cloud_sync"
}

main "$@"
