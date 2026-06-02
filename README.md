# 🎓 SiSeminar — Sistem Informasi & Manajemen Seminar

[![InsForge Backend](https://img.shields.io/badge/Backend-InsForge-blueviolet?style=for-the-badge)](https://insforge.dev)
[![Frontend-Vanilla](https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge)](#)
[![Status-Production](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)](#)

**SiSeminar** (Sistem Informasi Seminar) adalah platform web terpadu yang dirancang khusus untuk mempermudah komunikasi, manajemen event, pendaftaran peserta secara dinamis, presensi digital, hingga pengisian kuesioner seminar dalam satu atap. 

Aplikasi ini menggunakan arsitektur **Single Page Application (SPA)** berbasis *Vanilla JavaScript Modules* dengan desain premium (glassmorphism & modern layout) dan menggunakan **InsForge** sebagai all-in-one serverless backend (BaaS).

---

## ✨ Fitur Utama (Core Features)

### 1. 📅 Manajemen Event & Rundown Acara
* Admin dapat membuat, memperbarui, dan mengelola detail seminar (Judul, deskripsi, tanggal, lokasi, rundown, dresscode, banner).
* Dilengkapi dengan join code unik (6 karakter alfanumerik) untuk setiap event.

### 2. 📝 Pembuat Form Registrasi Kustom (Custom Form Builder)
* Fitur khusus admin untuk merancang formulir pendaftaran secara dinamis per event (tambah, edit, hapus field berupa Teks, Angka, Dropdown, atau Checkbox).
* Menyediakan klausa persetujuan wajib terintegrasi dengan anakku.id.

### 3. 👥 Multi-Grup Chat & Banner Kustom
* Admin dapat membuat beberapa grup obrolan terpisah untuk satu event.
* Setiap grup chat memiliki deskripsi, pengaturan privasi, dan cover/banner kustom.
* **Auto-Join:** Setelah peserta berhasil mendaftar via form registrasi, sistem otomatis mendaftarkan mereka ke semua grup chat event tersebut.

### 4. 📢 Broadcast Pengumuman & Chat Modern
* Antarmuka chat modern mirip aplikasi chat premium dengan fitur kirim teks, unggah gambar, serta tanda pengenal peran (Admin vs Peserta).
* Admin dapat melakukan broadcast pengumuman penting langsung ke seluruh anggota grup.

### 5. 📊 Dashboard spreadsheet Data Peserta (Spreadsheet View)
* Admin memiliki dashboard interaktif berbentuk tabel spreadsheet untuk melacak semua data registrasi peserta.
* Dilengkapi dengan fitur pencarian instan, filter status, pengurutan kolom, dan fungsi ekspor data langsung ke format **CSV/Excel**.

### 6. 🛡️ Presensi Digital via QR Code Aman
* Sistem presensi cerdas menggunakan QR Code unik yang dinamis dan terikat token per sesi untuk mencegah kecurangan scan dari luar lokasi.
* Admin dapat menampilkan QR Scanner di lokasi acara, dan peserta tinggal memindai QR tersebut dari akun mereka untuk check-in instan.

### 7. 💬 Kuesioner Feedback & Evaluasi
* Form evaluasi pasca-event berupa kuesioner dinamis untuk mengumpulkan masukan peserta demi perbaikan seminar di masa mendatang.

---

## 🛠️ Tech Stack & Arsitektur

Platform SiSeminar dibangun menggunakan teknologi modern yang efisien:

*   **Frontend Core:** HTML5 (Struktur Semantik) & Vanilla CSS3 (Custom design system dengan tokens, glassmorphism, responsive utilities, micro-animations).
*   **Aplikasi Logic:** Vanilla JavaScript Modules (SPA Router berbasis hash, modular component rendering).
*   **Libraries:** 
    *   [qrcode.js](https://github.com/davidshimjs/qrcodejs) (Untuk pembuatan QR Code presensi).
    *   [html5-qrcode](https://github.com/mebjas/html5-qrcode) (Untuk pemindaian QR Code secara real-time via kamera).
*   **Backend (BaaS):** [InsForge](https://insforge.dev)
    *   **Database:** PostgreSQL (Melalui InsForge Database Client dengan sinkronisasi Hybrid LocalStorage).
    *   **Autentikasi:** InsForge Auth (Login/Daftar Email & Google OAuth).
    *   **Storage:** InsForge Storage (Penyimpanan gambar banner event, banner grup chat, dan file gambar chat).
    *   **Real-time:** Real-time synchronization untuk sinkronisasi chat.

---

## 📂 Struktur Direktori Proyek

```text
sistem_informasi_seminar/
├── .insforge/                     # Konfigurasi proyek backend InsForge
├── js/                            # Logika JavaScript Modular (SPA Components)
│   ├── app.js                     # SPA Router & Pengontrol Layout Utama
│   ├── attendance.js              # Komponen Presensi Digital & QR Code Scanner
│   ├── auth.js                    # Halaman Autentikasi (Sign In, Sign Up, Google OAuth)
│   ├── chat.js                    # Komponen Multi Grup Chat & Broadcast
│   ├── events.js                  # Manajemen Event (Admin Panel & Detail)
│   ├── form-builder.js            # Pembuat Field Formulir Registrasi Dinamis
│   ├── participants.js            # Dashboard Spreadsheet Data Peserta
│   ├── registration.js            # Halaman Pendaftaran Publik Dinamis
│   └── store.js                   # Hybrid Data Store & Sinkronisasi DB InsForge
├── styles.css                     # Premium Design System (Design Tokens & Styles)
├── index.html                     # Entrypoint Tunggal Aplikasi (SPA Shell)
├── AGENTS.md                      # Panduan Coding & Integrasi Backend InsForge
├── PRD.md                         # Product Requirement Document (PRD) SiSeminar
└── README.md                      # Dokumentasi Teknis Utama Proyek (File Ini)
```

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi SiSeminar di komputer lokal Anda:

### 1. Prasyarat
Pastikan komputer Anda sudah terinstall **Node.js** (versi 16 atau lebih tinggi).

### 2. Login ke InsForge CLI
Sistem ini terintegrasi langsung dengan backend serverless InsForge. Gunakan API Key Anda untuk masuk via CLI:
```bash
npx @insforge/cli login --user-api-key uak_JgQXNIjQvI3WkQCpO7uRKoqI8O7Sl51kNywbniiQ8a4
```

### 3. Hubungkan Project ke Backend
Hubungkan direktori lokal Anda dengan project ID SiSeminar di cloud InsForge:
```bash
npx @insforge/cli link --project-id add328c3-b76a-447e-9c4f-5b66f0ed5111
```

### 4. Jalankan Server Lokal
Karena aplikasi ini berbasis *Vanilla HTML/JS*, Anda tidak perlu melakukan proses build/compile. Cukup jalankan server HTTP statis (misal `http-server`):
```bash
npx -y http-server -p 8085
```
Buka browser Anda dan akses alamat: [http://localhost:8085](http://localhost:8085)

---

## ☁️ Proses Pendeployan ke Cloud

Untuk mempublikasikan aplikasi Anda agar bisa diakses oleh publik secara langsung (live url), jalankan perintah deploy dari CLI InsForge:

```bash
npx @insforge/cli deploy
```

Setelah proses deploy berhasil, CLI akan memberikan URL Live aplikasi Anda (seperti `https://yf9g53qm.insforge.site`).

---

## 🔒 Keamanan & Aturan Data (RLS & Validation Policies)
Proyek ini mengimplementasikan aturan keamanan ketat berbasis **Row Level Security (RLS)** dan validasi integritas unik pada database PostgreSQL:
1.  Setiap data pendaftaran (`registrations`) dan presensi (`attendance`) secara otomatis dikaitkan dengan `user_id` milik pengguna yang sedang login.
2.  Peserta hanya memiliki hak akses baca/tulis terhadap data pribadi mereka sendiri.
3.  Hanya user dengan role `'admin'` yang memiliki hak istimewa (baca semua data, tambah/hapus grup, ekspor data, edit form builder).
4.  **Validasi Unik Nomor WhatsApp (`unique_event_phone`):** Kolom `(event_id, phone)` pada tabel `registrations` dilindungi oleh PostgreSQL Composite UNIQUE Constraint, yang membatasi agar satu nomor WhatsApp tidak dapat didaftarkan lebih dari sekali pada event/seminar yang sama.

---

## 🛡️ Aturan Siklus Hidup Event & Cascade Deletion
Untuk menjamin tidak adanya data sampah (*dangling/orphan references*) dan menjaga integritas database:
1.  **Auto-Initialization Event:** Saat admin membuat event baru, sistem otomatis membuat satu **grup chat umum** (`Grup Umum - ...`) dan menginisialisasi **formulir registrasi default** berisi 6 kolom standar (Nama, Nomor WhatsApp, Usia Ibu, Usia Anak, Kecamatan, dan Sumber Info) pada PostgreSQL.
2.  **Cascade Deletion:** Menghapus event melalui menu **Hapus Event** di dashboard admin akan secara otomatis menghapus seluruh baris data pada tabel `form_fields`, `chat_groups`, `chat_members`, `messages`, `registrations`, dan `attendance` yang terhubung dengan event tersebut, baik di cloud database PostgreSQL maupun memori lokal.
3.  **Hapus Peserta Terintegrasi:** Menghapus peserta secara asinkron dari Direktori Peserta otomatis mengurangi jumlah pendaftar event (`participantCount`) dan mengeluarkan akun peserta dari seluruh grup koordinasi event.

---

*SiSeminar dikembangkan dengan dedikasi penuh untuk menyajikan manajemen seminar yang profesional, modern, dan sangat mudah digunakan.* 🎓
