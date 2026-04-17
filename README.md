# Integrated Farming

Integrated Farming adalah aplikasi manajemen operasional dan investasi untuk usaha pertanian/peternakan. Repository ini berisi:

- `be/`: backend Django REST API
- `fe/`: frontend Next.js

## Fitur aktif

- autentikasi lokal yang diproxy ke SSO Arnatech
- login Google, MFA, dan passkeys
- manajemen aset
- pendanaan investor dan donasi
- pengeluaran operasional
- produksi dan stok produk
- penjualan hasil produksi
- distribusi bagi hasil
- dashboard ringkasan keuangan dan operasional
- pengaturan site dan user management

## Struktur utama

```text
.
├── be/
│   ├── authentication/
│   ├── asset/
│   ├── dashboard/
│   ├── expense/
│   ├── funding/
│   ├── production/
│   ├── profit_distribution/
│   ├── sales/
│   ├── site_settings/
│   └── smart_land/
└── fe/
    ├── app/
    ├── components/
    └── lib/
```

## Backend

Framework:

- Django 5
- Django REST Framework
- SimpleJWT
- SQLite default untuk development

Endpoint utama terdaftar di `be/smart_land/urls.py`:

- `/api/auth/`
- `/api/asset/`
- `/api/funding/`
- `/api/expense/`
- `/api/production/`
- `/api/sales/`
- `/api/profit-distribution/`
- `/api/dashboard/`
- `/api/settings/`

## Frontend

Framework:

- Next.js 15
- React 19
- Ant Design
- TanStack Query
- Zustand

Route utama:

- `/login`
- `/register`
- `/verify-email`
- `/admin`
- `/admin/asset`
- `/admin/pendanaan`
- `/admin/pengeluaran`
- `/admin/produksi`
- `/admin/penjualan`
- `/admin/bagi-hasil`
- `/admin/user-management`
- `/admin/pengaturan`
- `/admin/authentication`

## Menjalankan project

### 1. Backend

```bash
cd be
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend

```bash
cd fe
npm install
npm run dev
```

## Konfigurasi environment

Frontend membaca:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENTID`

Backend saat ini masih memakai konfigurasi development langsung di `be/smart_land/settings.py`, termasuk:

- `DEBUG = True`
- SQLite local database
- base URL SSO Arnatech

## Catatan kondisi codebase

Beberapa fitur lama belum aktif penuh dan saat ini dipertahankan sebagai placeholder aman:

- modul `proyek`
- modul `kepemilikan`
- halaman `test-api`

Fitur-fitur itu sebelumnya bergantung pada API client atau backend yang sudah tidak ada di repo aktif.

## Saran lanjutan

- pindahkan secret dan URL sensitif ke `.env`
- tambahkan test backend yang nyata untuk flow stok dan bagi hasil
- rapikan konsistensi endpoint frontend/backend
- implementasi ulang modul proyek/kepemilikan bila memang masih dibutuhkan
