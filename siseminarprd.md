# PRD — SiSeminar v2
### Sistem Informasi Manajemen Komunikasi Seminar

> **Versi:** 2.0  
> **Tanggal:** Juni 2026  
> **Status:** Draft — Siap Development

---

## 1. Project Overview

| Item | Detail |
|---|---|
| **Nama Aplikasi** | SiSeminar – Seminar Communication & Management System |
| **Target User** | Panitia seminar (admin) & peserta seminar |
| **Platform** | Web App (mobile-responsive) |
| **Problem** | Informasi seminar tersebar di banyak grup WA, sulit dikelola, tidak ada presensi & feedback digital yang terpusat |
| **Goal** | Satu platform untuk komunikasi, distribusi informasi, kuesioner, dan presensi peserta seminar |

---

## 2. Perubahan dari PRD v1

| # | Perubahan |
|---|---|
| ✅ 1 | Admin dapat menambah **Grup Chat** baru (tidak hanya 1 per event) |
| ✅ 2 | Admin dapat upload **banner / thumbnail** per grup chat |
| ✅ 3 | Form registrasi peserta **dikustomisasi admin**, termasuk field khusus & klausa persetujuan anakku.id — setelah submit otomatis join grup |
| ✅ 4 | **Hanya admin** yang bisa mengubah field form registrasi |
| ✅ 5 | Data masuk peserta tampil di backend admin seperti **spreadsheet** (filter, sortir, export) |

---

## 3. Core Features

| # | Fitur | Keterangan |
|---|---|---|
| F1 | Manajemen Event Seminar | Buat event dengan judul, tanggal, lokasi, cover |
| F2 | Multi Grup Chat | Admin bisa buat lebih dari 1 grup per event, masing-masing punya banner/thumbnail sendiri |
| F3 | Broadcast Pengumuman | Admin kirim pesan ke semua anggota grup sekaligus |
| F4 | Rundown Acara | Upload & tampilkan jadwal dengan urutan waktu |
| F5 | Info Dresscode | Teks + gambar referensi pakaian |
| F6 | Presensi Digital | QR Code scan check-in hari H |
| F7 | Kuesioner Feedback | Form evaluasi peserta pasca-acara |
| F8 | Form Registrasi Kustom | Admin buat & edit field form — peserta wajib isi saat mendaftar |
| F9 | Dashboard Data Peserta (Spreadsheet View) | Semua isian masuk tampil di tabel interaktif, bisa filter/sortir/export |
| F10 | Auto Join Grup | Setelah registrasi berhasil, peserta langsung masuk grup chat event |

---

## 4. Form Registrasi Peserta

Field default yang disiapkan oleh admin (dapat ditambah/diedit/dihapus):

- Nama lengkap *(wajib)*
- Usia anak (tahun) *(wajib)*
- Nomor WhatsApp *(wajib)*
- Usia Anda (** tahun) *(wajib)*
- Mengetahui informasi seminar dari: `[dropdown/pilihan]` *(wajib)*
- Kecamatan domisili *(wajib)*
- Klausa persetujuan *(checkbox wajib dicentang)*:

> *"Dengan melakukan klik/tap Submit atau Kirim, Anda berkenan dan memberi izin kepada [anakku.id](http://anakku.id/) untuk memperoleh, mengumpulkan, menggunakan, mengungkapkan dan/atau mengolah data yang telah diberikan serta bersedia menerima informasi terkait [anakku.id](http://anakku.id/)."*

### Aturan Form Registrasi

- Hanya admin yang bisa menambah, mengedit, dan menghapus field
- Peserta hanya bisa membaca & mengisi form
- Checkbox persetujuan **wajib dicentang** sebelum submit
- Setelah submit berhasil → akun dibuat → **auto join** ke semua grup chat event

---

## 5. User Roles & Permissions

| Permission | Admin | Peserta |
|---|:---:|:---:|
| Buat/edit event | ✅ | ❌ |
| Tambah/edit grup chat | ✅ | ❌ |
| Upload banner grup | ✅ | ❌ |
| Edit form registrasi | ✅ | ❌ |
| Lihat semua data registrasi | ✅ | ❌ |
| Export data peserta (CSV) | ✅ | ❌ |
| Broadcast pesan | ✅ | ❌ |
| Chat di grup | ✅ | ✅ |
| Isi form registrasi | ❌ | ✅ |
| Auto join grup setelah daftar | — | ✅ |
| Scan QR presensi | — | ✅ |
| Isi kuesioner | — | ✅ |

---

## 6. Database Schema

```
users
├── id
├── name
├── email
├── phone
├── password_hash
├── role: ENUM('admin', 'peserta')
└── created_at

events
├── id
├── title
├── description
├── date
├── location
├── cover_image
├── join_code (6 karakter unik)
├── admin_id → users.id
└── created_at

chat_groups
├── id
├── event_id → events.id
├── name
├── description
├── banner_image_url
├── created_by → users.id
└── created_at

chat_group_members
├── id
├── chat_group_id → chat_groups.id
├── user_id → users.id
└── joined_at

messages
├── id
├── chat_group_id → chat_groups.id
├── sender_id → users.id
├── content
├── type: ENUM('text', 'image', 'announcement')
└── created_at

registration_form_fields
├── id
├── event_id → events.id
├── label
├── field_type: ENUM('text', 'number', 'dropdown', 'checkbox')
├── options (JSON — untuk dropdown)
├── is_required
├── order_index
└── created_by → users.id

registration_responses
├── id
├── event_id → events.id
├── user_id → users.id
├── field_id → registration_form_fields.id
├── value (teks jawaban)
└── submitted_at

event_participants
├── id
├── event_id → events.id
├── user_id → users.id
└── joined_at

rundown_items
├── id
├── event_id → events.id
├── time
├── title
├── description
├── speaker
└── order_index

dresscode_info
├── id
├── event_id → events.id
├── title
├── description
└── image_url[] (JSON array)

attendance
├── id
├── event_id → events.id
├── user_id → users.id
├── checked_in_at
├── method: ENUM('qr', 'manual')
└── qr_token (unique per session)

questionnaires
├── id
├── event_id → events.id
├── title
├── description
└── is_active

questions
├── id
├── questionnaire_id → questionnaires.id
├── text
├── type: ENUM('rating', 'text', 'choice')
└── options (JSON array)

responses
├── id
├── questionnaire_id
├── question_id
├── user_id → users.id
└── answer (JSON)
```

---

## 7. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + shadcn/ui |
| Real-time Chat | Socket.io atau Supabase Realtime |
| Backend | Next.js API Routes |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Supabase atau Neon) |
| Auth | Better Auth |
| QR Code | `qrcode` + `html5-qrcode` library |
| Storage | Supabase Storage (gambar banner, dresscode, cover) |
| Hosting | Vercel |

---

## 8. API Endpoints

### Auth & Registrasi

```
POST   /api/auth/register           → submit form + auto join grup
POST   /api/auth/login
POST   /api/auth/logout
```

### Form Registrasi (admin only untuk write)

```
GET    /api/events/:id/form-fields
POST   /api/events/:id/form-fields
PUT    /api/events/:id/form-fields/:fid
DELETE /api/events/:id/form-fields/:fid
```

### Data Peserta (admin only)

```
GET    /api/events/:id/registrations
GET    /api/events/:id/registrations/export
```

### Events

```
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
```

### Grup Chat (multi-grup)

```
GET    /api/events/:id/groups
POST   /api/events/:id/groups
PUT    /api/events/:id/groups/:gid
DELETE /api/events/:id/groups/:gid
```

### Pesan

```
GET    /api/groups/:gid/messages
POST   /api/groups/:gid/messages
POST   /api/groups/:gid/broadcast
```

### Rundown

```
GET    /api/events/:id/rundown
POST   /api/events/:id/rundown
PUT    /api/events/:id/rundown/:itemId
DELETE /api/events/:id/rundown/:itemId
```

### Dresscode

```
GET    /api/events/:id/dresscode
POST   /api/events/:id/dresscode
PUT    /api/events/:id/dresscode/:did
```

### Presensi

```
POST   /api/events/:id/attendance/checkin
GET    /api/events/:id/attendance
GET    /api/events/:id/attendance/qr
```

### Kuesioner

```
GET    /api/events/:id/questionnaire
POST   /api/events/:id/questionnaire
POST   /api/events/:id/questionnaire/submit
GET    /api/events/:id/questionnaire/results
```

---

## 9. MVP Roadmap

### Sprint 1 — Foundation + Form Registrasi *(2 minggu)*

- [ ] Auth sistem (register/login)
- [ ] Buat & kelola event
- [ ] Builder form registrasi (admin) — tambah/edit/hapus field
- [ ] Halaman registrasi peserta dengan klausa persetujuan anakku.id
- [ ] Auto join grup setelah submit berhasil

### Sprint 2 — Multi Grup Chat + Komunikasi *(2 minggu)*

- [ ] Buat banyak grup per event
- [ ] Upload banner/thumbnail per grup chat
- [ ] Real-time chat per grup (Socket.io / Supabase Realtime)
- [ ] Broadcast announcement oleh admin
- [ ] QR Code presensi + check-in peserta

### Sprint 3 — Data Peserta + Feedback *(1–2 minggu)*

- [ ] Dashboard spreadsheet data peserta (tabel, filter, sortir)
- [ ] Export CSV / Excel data peserta
- [ ] Builder kuesioner (rating, pilihan, teks bebas)
- [ ] Form pengisian kuesioner peserta
- [ ] Statistik dashboard admin

### Sprint 4 — Polish + Deploy *(1 minggu)*

- [ ] Mobile responsive optimization
- [ ] Upload gambar ke Supabase Storage (banner, dresscode)
- [ ] Deploy ke Vercel + Supabase production
- [ ] Testing end-to-end

---

## 10. Estimasi Biaya Infrastruktur

| Item | Biaya |
|---|---|
| Supabase (DB + Storage) | Gratis (free tier) |
| Vercel (Hosting) | Gratis (free tier) |
| Domain .id | ~Rp 150.000/tahun |
| Developer (jika sewa) | Rp 5–15 juta (tergantung scope) |

---

*Dokumen ini adalah single source of truth untuk pengembangan SiSeminar.*  
*Setiap perubahan kebutuhan harus diperbarui di dokumen ini sebelum development dilanjutkan.*
