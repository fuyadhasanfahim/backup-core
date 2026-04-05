# 🚀 BackendSafe — MongoDB Backup System

A production-grade MongoDB backup system with a web dashboard for monitoring, control, and management.

## Features

- 🔄 **Automated Backups** — Cron-based daily backups at 2AM
- 📦 **Compression** — tar.gz compression for efficient storage
- ☁️ **Cloud Sync** — Automatic Nextcloud upload via rclone
- 🧹 **Auto Cleanup** — Configurable retention period
- 📊 **Web Dashboard** — Real-time monitoring and control panel
- 🔐 **Secure** — JWT auth, rate limiting, CORS, Helmet
- 🔔 **Notifications** — Telegram alerts on failure
- 🔄 **Restore** — One-click restore from any backup

## Architecture

```
dashboard (Next.js :3000)  →  API (Express :4000)  →  PostgreSQL
                                    ↓
                              backup.sh  →  MongoDB  →  Nextcloud
```

## Quick Start

### 1. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Generate Password Hash

```bash
cd server
node -e "const b=require('bcryptjs');console.log(b.hashSync('your-password',10))"
# Copy the hash to ADMIN_PASSWORD_HASH in .env
```

### 3. Start Server

```bash
cd server
npm install
npx prisma db push
npm run dev
```

### 4. Start Dashboard

```bash
cd dashboard
npm install
npm run dev
```

### 5. Setup Cron (on VPS)

```bash
chmod +x scripts/*.sh
bash scripts/cron-setup.sh
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | ❌ | Login |
| POST | /api/auth/logout | ✅ | Logout |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/backups | ✅ | List backups |
| GET | /api/backups/stats | ✅ | Backup stats |
| POST | /api/backups/trigger | ✅ | Trigger backup |
| POST | /api/backups/log | 🔑 | Log result (script) |
| DELETE | /api/backups/:id | ✅ | Delete backup |
| POST | /api/backups/:id/restore | ✅ | Restore backup |
| GET | /api/storage | ✅ | Disk usage |
| GET | /api/storage/history | ✅ | Storage history |

## License

MIT
# backup-core
