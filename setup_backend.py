#!/usr/bin/env python3
"""
Luna - Hermes Dashboard Backend Setup Script
=======================================
Jalankan SEKALI untuk menyiapkan backend standalone dashboard:

    python setup_backend.py

Script ini akan:
1. Copy web_server.py dari hermes-agent ke backend/server.py
2. Patch 4 hal kecil di server.py
3. Memberi tahu langkah selanjutnya

Tidak ada perubahan ke file Hermes asli.
"""

import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
HERMES_AGENT = SCRIPT_DIR.parent / "hermes-agent"
SOURCE = HERMES_AGENT / "hermes_cli" / "web_server.py"
DEST = SCRIPT_DIR / "backend" / "server.py"


def check_prerequisites():
    if not SOURCE.exists():
        print(f"❌  Tidak menemukan web_server.py di:\n    {SOURCE}")
        print("    Pastikan hermes-agent ada satu level di atas hermes-dashboard/")
        sys.exit(1)
    DEST.parent.mkdir(parents=True, exist_ok=True)
    print(f"✅  Source   : {SOURCE}")
    print(f"✅  Target   : {DEST}")


def patch_and_write(content: str) -> str:
    """Terapkan semua patch ke konten file."""

    # ── Patch 1: PROJECT_ROOT ──────────────────────────────────────────────
    old = (
        "PROJECT_ROOT = Path(__file__).parent.parent.resolve()\n"
        "if str(PROJECT_ROOT) not in sys.path:\n"
        "    sys.path.insert(0, str(PROJECT_ROOT))"
    )
    new = (
        "# ── Standalone Dashboard: point to hermes-agent ──────────────────\n"
        "PROJECT_ROOT = Path(__file__).parent.parent.parent / \"hermes-agent\"\n"
        "if not PROJECT_ROOT.exists():\n"
        "    # Fallback: assume we're running from inside hermes-agent\n"
        "    PROJECT_ROOT = Path(__file__).parent.parent.resolve()\n"
        "if str(PROJECT_ROOT) not in sys.path:\n"
        "    sys.path.insert(0, str(PROJECT_ROOT))"
    )
    if old in content:
        content = content.replace(old, new, 1)
        print("✅  Patch 1: PROJECT_ROOT → hermes-agent/")
    else:
        print("⚠️   Patch 1 SKIP: pola PROJECT_ROOT tidak ditemukan (mungkin sudah dipatch)")

    # ── Patch 2: WEB_DIST ─────────────────────────────────────────────────
    old2 = 'WEB_DIST = Path(os.environ["HERMES_WEB_DIST"]) if "HERMES_WEB_DIST" in os.environ else Path(__file__).parent / "web_dist"'
    new2 = (
        "WEB_DIST = (\n"
        "    Path(os.environ[\"HERMES_WEB_DIST\"])\n"
        "    if \"HERMES_WEB_DIST\" in os.environ\n"
        "    else Path(__file__).parent.parent / \"dist\"  # → hermes-dashboard/dist/\n"
        ")"
    )
    if old2 in content:
        content = content.replace(old2, new2, 1)
        print("✅  Patch 2: WEB_DIST → hermes-dashboard/dist/")
    else:
        print("⚠️   Patch 2 SKIP: pola WEB_DIST tidak ditemukan")

    # ── Patch 3: Port default ─────────────────────────────────────────────
    old3 = "    port: int = 9119,"
    new3 = "    port: int = 8119,  # Custom port — tidak konflik dengan hermes dashboard (9119)"
    if old3 in content:
        content = content.replace(old3, new3, 1)
        print("✅  Patch 3: Port default 9119 → 8119")
    else:
        print("⚠️   Patch 3 SKIP: pola port 9119 tidak ditemukan di start_server()")

    # ── Patch 4: Tambah /api/dashboard/commands ke PUBLIC paths ───────────
    old4 = '    "/api/dashboard/plugins/rescan",'
    new4 = (
        '    "/api/dashboard/plugins/rescan",\n'
        '    "/api/dashboard/commands",    # Custom: parse HERMES_COMMANDS.md'
    )
    if '"/api/dashboard/commands"' not in content and old4 in content:
        content = content.replace(old4, new4, 1)
        print("✅  Patch 4: /api/dashboard/commands ditambahkan ke PUBLIC paths")
    else:
        print("⚠️   Patch 4 SKIP: sudah ada atau pola tidak ditemukan")

    # ── Patch 5: Inject custom endpoint before start_server ───────────────
    CUSTOM_ENDPOINTS = r'''
# ═══════════════════════════════════════════════════════════════════════════
# Custom Dashboard Extensions — tambahkan endpoint baru di bawah ini
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/commands")
async def get_dashboard_commands():
    """Parse dan kembalikan daftar commands dari HERMES_COMMANDS.md."""
    import re as _re
    commands_path = PROJECT_ROOT.parent / "HERMES_COMMANDS.md"
    if not commands_path.exists():
        _log.warning("HERMES_COMMANDS.md not found at %s", commands_path)
        return {"sections": []}
    try:
        content = commands_path.read_text(encoding="utf-8")
    except Exception as e:
        _log.error("Failed to read HERMES_COMMANDS.md: %s", e)
        return {"sections": []}
    sections, current_section = [], None
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("## "):
            current_section = {"name": line[3:].strip(), "commands": []}
            sections.append(current_section)
        elif line.startswith("- ") and current_section is not None:
            raw = line[2:].strip()
            parts = _re.split(r'\s*[—\-]\s*', raw, maxsplit=1)
            if len(parts) == 2:
                current_section["commands"].append({
                    "name": _re.sub(r'[`*]+', '', parts[0]).strip(),
                    "desc": parts[1].strip(),
                })
    return {"sections": sections}


# ═══════════════════════════════════════════════════════════════════════════
'''

    marker = "\ndef start_server("
    if "get_dashboard_commands" not in content and marker in content:
        content = content.replace(marker, CUSTOM_ENDPOINTS + "\ndef start_server(", 1)
        print("✅  Patch 5: Custom endpoint /api/dashboard/commands ditambahkan")
    else:
        print("⚠️   Patch 5 SKIP: sudah ada atau start_server() tidak ditemukan")

    # ── Patch 7: Login endpoint (username/password → session token) ───────
    LOGIN_ENDPOINT = r'''

@app.post("/api/auth/login")
async def dashboard_login(request: Request):
    """Validasi username/password dari env, kembalikan session token jika valid."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    username = body.get("username", "").strip()
    password = body.get("password", "").strip()

    expected_user = os.getenv("DASHBOARD_USERNAME", "admin").strip()
    expected_pass = os.getenv("DASHBOARD_PASSWORD", "").strip()

    if not expected_pass:
        # Jika password tidak di-set, tolak semua login
        raise HTTPException(status_code=503, detail="Login disabled: DASHBOARD_PASSWORD not configured")

    if username == expected_user and password == expected_pass:
        return JSONResponse({"token": _SESSION_TOKEN, "ok": True})
    else:
        raise HTTPException(status_code=401, detail="Username atau password salah")

'''

    if "dashboard_login" not in content:
        # Inject setelah get_dashboard_commands block (atau sebelum start_server)
        marker2 = "\ndef start_server("
        if marker2 in content:
            content = content.replace(marker2, LOGIN_ENDPOINT + "\ndef start_server(", 1)
            print("✅  Patch 7: Login endpoint /api/auth/login ditambahkan")
        else:
            print("⚠️   Patch 7 SKIP: marker start_server() tidak ditemukan")
    else:
        print("⚠️   Patch 7 SKIP: login endpoint sudah ada")

    # Pastikan /api/auth/login juga ada di PUBLIC paths
    public_marker = '    "/api/dashboard/commands",'
    public_login = '    "/api/dashboard/commands",\n    "/api/auth/login",'
    if '"/api/auth/login"' not in content and public_marker in content:
        content = content.replace(public_marker, public_login, 1)
        print("✅  Patch 7b: /api/auth/login ditambahkan ke PUBLIC paths")

    # ── Patch 6: Graceful fallback saat hermes_cli tidak tersedia ─────────
    # Wrap semua import hermes_cli dengan try/except agar server tetap jalan
    GRACEFUL_IMPORTS = '''
# ── Graceful Hermes Import ────────────────────────────────────────────────
# Server tetap jalan walaupun Hermes tidak terinstall. Endpoint yang membutuhkan
# Hermes akan mengembalikan {"error": "hermes_not_installed"}.
_HERMES_AVAILABLE = False
_HERMES_VERSION = "not installed"

try:
    from hermes_cli import __version__, __release_date__
    _HERMES_VERSION = __version__
    _HERMES_AVAILABLE = True
except ImportError:
    __version__ = "0.0.0"
    __release_date__ = "unknown"

if _HERMES_AVAILABLE:
    try:
        from hermes_cli.config import (
            cfg_get, DEFAULT_CONFIG, OPTIONAL_ENV_VARS,
            get_config_path, get_env_path, get_hermes_home,
            load_config, load_env, save_config, save_env_value,
            remove_env_value, check_config_version, redact_key,
        )
        from gateway.status import get_running_pid, read_runtime_status
    except ImportError as _e:
        _HERMES_AVAILABLE = False
        import warnings
        warnings.warn(f"Hermes modules not fully available: {_e}")

'''

    old6 = 'from hermes_cli import __version__, __release_date__\n'
    if '_HERMES_AVAILABLE' not in content and old6 in content:
        # Find the block from `from hermes_cli import ...` to `from gateway.status import ...`
        old_block = (
            'from hermes_cli import __version__, __release_date__\n'
            'from hermes_cli.config import (\n'
            '    cfg_get,\n'
            '    DEFAULT_CONFIG,\n'
            '    OPTIONAL_ENV_VARS,\n'
            '    get_config_path,\n'
            '    get_env_path,\n'
            '    get_hermes_home,\n'
            '    load_config,\n'
            '    load_env,\n'
            '    save_config,\n'
            '    save_env_value,\n'
            '    remove_env_value,\n'
            '    check_config_version,\n'
            '    redact_key,\n'
            ')\n'
            'from gateway.status import get_running_pid, read_runtime_status\n'
        )
        if old_block in content:
            content = content.replace(old_block, GRACEFUL_IMPORTS, 1)
            print("✅  Patch 6: Graceful fallback import ditambahkan (server jalan tanpa Hermes)")
        else:
            print("⚠️   Patch 6 SKIP: pola import Hermes tidak cocok persis")
    else:
        print("⚠️   Patch 6 SKIP: sudah ada atau tidak diperlukan")

    return content


def main():
    print("\n🔧 Luna - Hermes Dashboard Backend Setup\n" + "=" * 40)
    check_prerequisites()

    print("\n📋 Membaca source...")
    content = SOURCE.read_text(encoding="utf-8")
    print(f"    {len(content.splitlines())} baris dibaca")

    print("\n🔨 Menerapkan patch...")
    patched = patch_and_write(content)

    print(f"\n💾 Menulis ke {DEST}...")
    DEST.write_text(patched, encoding="utf-8")
    print(f"    {len(patched.splitlines())} baris ditulis")

    print("\n✅ Setup selesai!\n")
    print("Langkah selanjutnya:")
    print("  1. pip install fastapi uvicorn[standard] pyyaml ptyprocess")
    print("  2. cd hermes-dashboard/backend")
    print("  3. python -m uvicorn server:app --port 8119 --reload")
    print("  4. cd .. && npm run dev\n")


if __name__ == "__main__":
    main()
