# Luna - Hermes Dashboard — Development Blueprint

Dokumen ini berfungsi sebagai panduan teknis mendalam (Blueprint) untuk arsitektur Luna - Hermes Dashboard. Gunakan dokumen ini sebagai referensi utama saat mengembangkan fitur baru untuk menjaga konsistensi arsitektur.

---

## 1. Arsitektur Sistem Modular

Luna - Hermes Dashboard menggunakan pemisahan tegas antara **Logic Viewers** dan **Display Portals**.

### A. Modular Viewers (`src/components/`)

Komponen yang mengandung logika bisnis inti dan state. Dapat digunakan kembali di halaman mana pun atau di dalam modal.

- **`DocsViewer.jsx`**: Logic engine untuk dokumentasi. Menangani tab (Docs vs Skills), pencarian, filtering kategori, dan rendering markdown.
- **`ChatViewer.jsx`**: Logic engine untuk terminal. Menangani WebSocket lifecycle (`xterm.js`), resize handling, dan status koneksi backend.

### B. Portal System (`src/components/`)

Container interaktif untuk Viewers.

- **`FloatingDocsModal.jsx`**: Wrapper untuk `DocsViewer`. Mendukung fitur _draggable_, _resizable_, dan _maximize/minimize_.
- **`FloatingChatModal.jsx`**: Wrapper untuk `ChatViewer`. Dirancang untuk akses global yang persisten di seluruh aplikasi.

---

## 2. Struktur Halaman (Pages)

Setiap halaman di `src/pages/` dirancang sesederhana mungkin, biasanya hanya memanggil **Logic Viewer** yang sesuai.

| Halaman        | Deskripsi                                  | Komponen Utama                           |
| :------------- | :----------------------------------------- | :--------------------------------------- |
| `Overview`     | Dasbor utama dengan statistik sistem.      | `MCard`, `HEALTH` mock                   |
| `ChatPage`     | Halaman terminal full-screen.              | `ChatViewer`                             |
| `DocsPage`     | Pusat dokumentasi dan katalog skill (Hub). | `DocsViewer`                             |
| `SkillsPage`   | Manajemen aktivasi plugin/skill.           | `SkillsHub` (integrated in `DocsViewer`) |
| `ProfilesPage` | Manajemen persona agent (Soul editor).     | Custom Logic                             |
| `ConfigPage`   | Editor konfigurasi `config.yaml`.          | Dynamic Form Generator                   |

---

## 3. Backend API Engine (`backend/server.py`)

Backend FastAPI bertindak sebagai jembatan (`bridge`) ke agentic core.

### Dokumentasi & Skills

- **`GET /api/docs/topics`**: Mengambil navigasi dari folder docs.
- **`GET /api/docs/skills`**: Ekstraksi metadata kaya dari `skills-catalog.md` (iklan, platform, status).
- **`GET /api/docs/user-stories`**: Metadata untuk landing page dokumentasi (Hub).
- **`GET /api/docs/content/{path}`**: Sanitasi markdown (strip mdx) dan penyajian konten.

### Terminal (PTY) Proxy

- **`WS /api/pty`**: Proxy TTY/PTY yang menghubungkan terminal di UI ke sistem shell backend. Mendukung command RESIZE secara native.

---

## 4. Design System & Style

Dashboard menggunakan **Vanilla CSS Tokens** tanpa framework eksternal untuk fleksibilitas maksimal. Variabel ini didefinisikan di `src/App.jsx` dalam template string `G`.

- **Colors**: `--bg` (Ultra Dark), `--ac` (Cyan Accent), `--s1-s3` (Surface levels).
- **Animations**: `pgi` (page entrance), `blink` (status indicator).

---

## 5. Panduan Pengembangan (Best Practices)

1.  **Jangan Duplikasi Logika Chat**: Jika butuh terminal di tempat baru, gunakan `ChatViewer`.
2.  **Gunakan `api.js`**: Jangan memanggil `fetch` atau `axios` secara langsung. Gunakan wrapper di `src/lib/api.js`.
3.  **Persistence**: Untuk state yang harus tetap ada saat pindah halaman (seperti Chat), simpan di level `App.jsx` atau pastikan komponen tetap dirender (misal dengan `display: none`).
4.  **Aesthetics**: Pertahankan estetika "Premium Monospace". Gunakan font `JetBrains Mono` untuk elemen data dan `Outfit` untuk UI.

---

## 7. Referensi Dashboard Bawaan (Official)

Jika Anda memerlukan referensi fitur asli Hermes untuk meniru logika atau melakukan studi komparasi, source code dashboard bawaan dapat ditemukan di:

- **`hermes-agent/web/`**: Berisi source code React/TypeScript dari dashboard resmi Hermes.
- **`hermes-agent/web/src/pages/`**: Referensi implementasi halaman asli.

Dashboard kustom kita (`hermes-dashboard`) dirancang untuk memiliki fitur yang jauh lebih "powerful" (seperti portal mengambang, high-fidelity hub, dll) namun tetap sinkron dengan backend yang sama.

---

## 8. File Penting Lainnya

- `start.sh`: Runner paralel (Backend + Frontend).
- `setup_backend.py`:Dependency checker.
- `PLAN_HERMES_MEMORY_OBSIDIAN.md`: Rencana masa depan integrasi memory.
