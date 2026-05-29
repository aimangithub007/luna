#!/bin/bash
# ============================================================
# Script Pembersih Workspace Luna Dashboard
# ============================================================
# Script ini akan menghapus semua file build dan dependencies
# agar folder luna menjadi sangat kecil/bersih sebelum didistribusikan.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🧹 Memulai pembersihan cache dan dependencies instalasi..."

# 1. Hapus dependencies Node.js
if [ -d "$SCRIPT_DIR/node_modules" ]; then
    echo "  - Menghapus node_modules/..."
    rm -rf "$SCRIPT_DIR/node_modules"
fi

# 2. Hapus build folder frontend (Production files)
if [ -d "$SCRIPT_DIR/dist" ]; then
    echo "  - Menghapus dist/..."
    rm -rf "$SCRIPT_DIR/dist"
fi

# 3. Hapus cache Python backend
if [ -d "$SCRIPT_DIR/backend/__pycache__" ]; then
    echo "  - Menghapus backend/__pycache__..."
    rm -rf "$SCRIPT_DIR/backend/__pycache__"
fi

# (Dihapus: Kita tidak lagi menghapus server.py karena sudah dimodifikasi secara kustom khusus Luna)

# File .env maupun package-lock.json biasanya sengaja DIBIARKAN 
# agar konfigurasi rahasia & versi tidak berubah.

echo ""
echo "✨ Selesai! Ukuran folder Luna kini menjadi murni kode asal (super minimalis)."
echo "     Untuk melakukan instalasi/pemakaian di komputer lain:"
echo "       1. npm install"
echo "       2. pip install -r backend/requirements.txt"
echo "       3. ./serve"
