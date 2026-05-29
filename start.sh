#!/bin/bash
# ============================================================
# Hermes Custom Dashboard — Standalone Launcher
# ============================================================
# Jalankan: ./start.sh
# Akses   : http://localhost:3000
# API Docs: http://localhost:8119/docs
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Load .env file (jika ada) ────────────────────────────────
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

BACKEND_PORT="${BACKEND_PORT:-8119}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
HERMES_AGENT="$SCRIPT_DIR/../hermes-agent"

# ── Pastikan backend/server.py sudah dibuat ──────────────────
if [ ! -f "$SCRIPT_DIR/backend/server.py" ]; then
    echo ""
    echo "❌  backend/server.py belum ada!"
    echo "    Jalankan setup sekali dulu:"
    echo ""
    echo "    cd $SCRIPT_DIR"
    echo "    python setup_backend.py"
    echo ""
    exit 1
fi

# ── Pastikan dist/ sudah build ───────────────────────────────
if [ ! -d "$SCRIPT_DIR/dist" ]; then
    echo "⚠️  dist/ tidak ditemukan. Build frontend dulu..."
    cd "$SCRIPT_DIR"
    npm run build
    echo "✅  Build selesai"
fi

# ── Cek Python tersedia ──────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "❌  python3 tidak ditemukan di PATH"
    exit 1
fi

# ── Jalankan Backend ─────────────────────────────────────────
echo ""
echo "🚀 Starting Custom Dashboard Backend..."
echo "   Port     : $BACKEND_PORT"
echo "   Hermes   : $HERMES_AGENT"
echo ""

# ── Serve Keduanya Lewat Backend ─────────────────────────────
echo "🌐 Melayani Web UI dan API sekaligus melalui Uvicorn..."
echo "   Silakan akses: http://<ip-vps>:$BACKEND_PORT"
echo ""

cd "$SCRIPT_DIR/backend"
# Gunakan 0.0.0.0 agar bisa diakses dari luar (VPS public IP)
python3 -m uvicorn server:app \
    --host 0.0.0.0 \
    --port "$BACKEND_PORT" \
    --log-level info

