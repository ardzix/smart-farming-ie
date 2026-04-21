# Integrated Farming

Integrated Farming adalah aplikasi manajemen operasional dan investasi untuk usaha pertanian/peternakan. Repository ini terdiri dari:

- `be/`: backend Django REST API
- `fe/`: frontend Next.js
- `scripts/`: helper script untuk menjalankan backend dan frontend lokal

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
├── fe/
│   ├── app/
│   ├── components/
│   └── lib/
└── scripts/
```

## Backend

Framework:

- Django 5
- Django REST Framework
- SimpleJWT
- SQLite default untuk development
- PostgreSQL optional lewat env

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

Catatan frontend:

- untuk local Windows, Node 20 LTS lebih disarankan
- pada beberapa environment, Node 22 dapat memunculkan error `spawn EPERM` saat `next dev`

### 3. Jalankan sekaligus

Script helper tersedia di folder `scripts/`:

```bash
sh scripts/run-local.sh
```

Windows PowerShell:

```powershell
.\scripts\run-local.ps1
```

Windows CMD:

```bat
scripts\run-local.bat
```

## Konfigurasi environment

Frontend membaca:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENTID`

Backend auto-load file `be/.env`.

Contoh env backend tersedia di `be/.env.example`, mencakup:

- Django core settings
- database SQLite/PostgreSQL
- JWT settings
- CORS settings
- media/static settings
- SSO settings termasuk `SSO_PUBLIC_KEY_PATH`

Backend mendukung:

- SQLite default
- PostgreSQL jika `USE_POSTGRES=True`

Contoh minimal PostgreSQL:

```env
USE_POSTGRES=True
DB_ENGINE=django.db.backends.postgresql
DB_NAME=integrated_farming
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Public key SSO sebaiknya diletakkan di:

```text
be/authentication/keys/public.pem
```

atau di path lain dan diarahkan lewat `SSO_PUBLIC_KEY_PATH`.

## Authentication dan RBAC

Arsitektur auth/RBAC aktif saat ini:

- autentikasi diproxy ke SSO Arnatech
- permission enforcement aktif berbasis granular permission SSO
- role lokal Django tidak lagi dipakai sebagai dasar akses aktif

## Catatan kondisi codebase

Beberapa fitur lama belum aktif penuh dan saat ini dipertahankan sebagai placeholder aman:

- modul `proyek`
- modul `kepemilikan`
- halaman `test-api`

Fitur-fitur itu sebelumnya bergantung pada API client atau backend yang sudah tidak ada di repo aktif.

## Saran lanjutan

- tambahkan test backend yang nyata untuk flow stok dan bagi hasil
- rapikan konsistensi endpoint frontend/backend
- implementasi ulang modul proyek/kepemilikan bila memang masih dibutuhkan
