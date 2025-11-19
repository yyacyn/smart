# 🧾 Prompt: Generate CRUD API for Category (Next.js + Prisma)

## 📘 Context
Saya sedang membuat proyek **Next.js 14 (App Router)** yang sudah menggunakan **Prisma ORM**.

Saya sudah memiliki file `schema.prisma` terbaru dengan model **Category** berikut (silakan baca file prisma saya langsung untuk validasi tipe dan enum):

```prisma
model Category {
  id               Int        @id @default(autoincrement())
  name             String
  description      String?
  image            String?
  status           CategoryStatus @default(ACTIVE)
  slug             String      @unique
  metaTitle        String?
  metaDescription  String?
  sortOrder        Int?        @default(0)
  parentCategoryId Int?
  parentCategory   Category?   @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  subcategories    Category[]  @relation("CategoryHierarchy")
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

enum CategoryStatus {
  ACTIVE
  INACTIVE
}

🎯 Goal
Buatkan fitur CRUD lengkap untuk Category yang mencakup:
1. API (backend)
2. Frontend admin pages

⚙️ Bagian 1 — API CRUD

Buatkan API CRUD lengkap untuk model Category menggunakan folder:

app/api/categories/

📁 Struktur file yang diinginkan:

app/api/categories/route.js

Method:

GET: mengambil semua kategori (termasuk relasi parentCategory dan subcategories)

POST: menambah kategori baru

app/api/categories/[id]/route.js

Method:

GET: ambil detail satu kategori berdasarkan id

PUT: update kategori

DELETE: hapus kategori

⚙️ Ketentuan Penting

Jangan install library tambahan.
Gunakan hanya library yang sudah tersedia (next, @prisma/client, dsb).

Gunakan:

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
const prisma = new PrismaClient();


Semua response harus dalam format JSON seperti:

return NextResponse.json({ success: true, data });


Tangani error dengan try...catch dan kirim response error JSON dengan success: false.

Untuk POST dan PUT, ambil data dari body JSON.

Jika slug tidak dikirim, buat otomatis dari name:

const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .trim();


Untuk GET list, sertakan:

include: {
  parentCategory: true,
  subcategories: true
}

🎨 Bagian 2 — Frontend Admin CRUD

Buatkan folder:

app/admin/categories/

Halaman yang harus dibuat:

app/admin/categories/page.js — List kategori

Menampilkan daftar kategori dalam tabel.

Tombol untuk:

Tambah kategori baru

Edit

Hapus

Gunakan desain dan gaya yang konsisten dengan halaman lain di proyek (lihat contoh di app/admin/...(folder yang ada)/page.js atau page.js yang sudah ada).

Tampilkan kolom seperti:

Nama

Slug

Status

Jumlah subkategori

Tanggal dibuat

Aksi (Edit/Delete)

app/admin/categories/add/page.js — Tambah kategori

Form sesuai field di schema (seperti name, description, image, status, metaTitle, metaDescription, sortOrder, dan parentCategory).

Menggunakan Tailwind & struktur UI yang sama seperti page.js sebelumnya (gunakan card, form grid, tombol, dsb).

app/admin/categories/[id]/edit/page.js — Edit kategori

Ambil data dari API detail kategori (GET /api/categories/[id]).

Tampilkan form yang sama seperti “Tambah” tapi dengan data terisi.

Tombol “Update” dan “Cancel”.

🧠 Panduan tambahan

Gunakan axios('/api/categories') untuk ambil data dari API.

Gunakan router.push('/admin/categories') setelah operasi berhasil (create/update/delete).

Jangan tambahkan dependency baru.

Gunakan komponen yang sudah tersedia di proyek (Tailwind, React Icons, dsb).

Jika perlu placeholder kategori induk, gunakan relasi parentCategoryId.

Gunakan gaya clean dan idiomatik untuk App Router API (export async function GET, dll).

Jangan menjalankan migrasi, testing, atau server — cukup tampilkan kodenya saja.

✅ Output yang Diharapkan

Berikan dua file kode lengkap:

app/api/categories/route.js

app/api/categories/[id]/route.js

Tidak perlu penjelasan panjang atau komentar tambahan di luar kode.