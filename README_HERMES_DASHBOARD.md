# Luna - Hermes Dashboard — Arsitektur & Panduan Logika

Dokumen ini menjelaskan struktur, alur logika, dan file-file penting dalam implementasi kustom dashboard Hermes.

---

## 1. Arsitektur Inti

Dashboard ini dibangun dengan arsitektur **Client-Server** yang beroperasi secara lokal, sinkron dengan instalasi Hermes Anda.

```mermaid
graph LR
    subgraph Frontend (React + Vite)
        A[src/App.jsx] --> B[src/pages/]
        B --> C[src/lib/api.js]
    end

    C -- "REST API" --> D[backend/server.py]

    subgraph Backend (FastAPI)
        D --> E[Config Management]
        D --> F[Terminal PTY]
        D --> G[Plugin Engine]
        D --> H[Profile Switcher]
    end

    Backend --> I[~/.hermes/ (Home)]
```

### Alur Logika:

1.  **Discovery**: Saat startup, backend (`server.py`) memindai direktori `~/.hermes` untuk menemukan profil, plugin, dan konfigurasi.
2.  **API Bridge**: Frontend berkomunikasi melalui `src/lib/api.js` yang menyediakan wrapper fungsi untuk mempermudah pemanggilan endpoint FastAPI.
3.  **State Management**: Dashboard menggunakan state lokal React dan memuat data secara asinkron (`useEffect`) untuk menjaga performa tetap responsif.
4.  **Security**: Menggunakan token-based session yang disimpan di `localStorage` untuk membatasi akses ke API backend.

---

## 2. File-File Penting

### Core Backend

- **[server.py](backend/server.py)**: Jantung dari backend. Mengelola endpoint untuk CRUD profil, manajemen skill, pembacaan log secara streaming, dan proxy ke terminal sistem. Menggunakan FastAPI untuk kecepatan tinggi.
- **[setup_backend.py](setup_backend.py)**: Script pembantu untuk inisialisasi environment backend dan pengecekan dependensi Python.

### Core Frontend (Source)

- **[App.jsx](src/App.jsx)**: Entry point utama frontend. Berisi definisi **Design System** (CSS variables), sistem routing (halaman mana yang tampil), dan komponen Sidebar/Header global.
- **[src/lib/api.js](src/lib/api.js)**: Client API tunggal. Semua pemanggilan ke backend HARUS melalui file ini untuk konsistensi penanganan error dan token.
- **[src/pages/ProfilesPage.jsx](src/pages/ProfilesPage.jsx)**: Logika manajemen identitas Hermes (Soul editor, Rename, Copy Terminal Command).
- **[src/pages/SkillsPage.jsx](src/pages/SkillsPage.jsx)**: Antarmuka untuk mengaktifkan/menonaktifkan kemampuan agent (Skill/Plugin) dengan filter kategori.

---

## 3. File & Direktori Lainnya (Utility)

- **[start.sh](start.sh)**: Script otomatis untuk menjalankan server backend (Python) dan server frontend (Vite) secara paralel dalam satu terminal.
- **[vite.config.js](vite.config.js)**: Konfigurasi build tool Vite, termasuk proxy API agar frontend bisa 'berbicara' ke backend tanpa masalah CORS.
- **[package.json](package.json)**: Daftar semua dependensi JavaScript (React, Lucide icons, Xterm.js).
- **[.env](.env)**: Menyimpan konfigurasi lingkungan seperti API Keys kustom atau port server dashboard.
- **[backend/auth.py](backend/auth.py)**: Penanganan logika login dan verifikasi password admin.

---

## 4. Filosofi Desain

Dashboard ini menggunakan sistem **"Premium Dark Theme"** yang dirancang tanpa framework eksternal (seperti Tailwind) agar tetap ringan dan mudah dimodifikasi langsung melalui variabel CSS di `:root` (lihat `App.jsx`).
