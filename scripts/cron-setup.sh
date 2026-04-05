#!/bin/bash
# ============================================================
# Cron Job Setup Script
# Installs the daily 2AM backup cron job
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
LOG_FILE="/var/log/backup-core.log"

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Cron expression: 2:00 AM every day
CRON_SCHEDULE="0 2 * * *"
CRON_ENTRY="${CRON_SCHEDULE} ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
  echo "⚠️  Cron job already exists. Updating..."
  # Remove existing entry
  crontab -l 2>/dev/null | grep -vF "$BACKUP_SCRIPT" | crontab -
fi

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job installed:"
echo "   Schedule: Daily at 2:00 AM"
echo "   Script:   ${BACKUP_SCRIPT}"
echo "   Log:      ${LOG_FILE}"
echo ""
echo "Current crontab:"
crontab -l

# Create log file if it doesn't exist
touch "$LOG_FILE"
echo "📝 Log file ready: ${LOG_FILE}"
