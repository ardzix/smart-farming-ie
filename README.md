# Integrated Farming

Integrated Farming is an operations and investment management platform for agriculture and livestock businesses. This repository contains:

- `be/`: Django REST backend
- `fe/`: Next.js frontend
- `scripts/`: helper scripts for running the backend and frontend locally

## Active Features

- local authentication proxied to Arnatech SSO
- Google login, MFA, and passkeys
- asset management
- investor funding and donations
- operating expenses
- production tracking and product stock
- sales recording
- profit distribution
- operational and financial dashboard summaries
- site settings and user management

## Main Structure

```text
.
|-- be/
|   |-- authentication/
|   |-- asset/
|   |-- dashboard/
|   |-- expense/
|   |-- funding/
|   |-- production/
|   |-- profit_distribution/
|   |-- sales/
|   |-- site_settings/
|   `-- smart_land/
|-- fe/
|   |-- app/
|   |-- components/
|   `-- lib/
`-- scripts/
```

## Backend

Stack:

- Django 5
- Django REST Framework
- SimpleJWT
- SQLite by default for development
- optional PostgreSQL via environment variables

Primary endpoints are registered in `be/smart_land/urls.py`:

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

Stack:

- Next.js 15
- React 19
- Ant Design
- TanStack Query
- Zustand
- lightweight client-side locale switching (`id` / `en`)

Primary routes:

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

## Running the Project

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

Frontend notes:

- Node 20 LTS is recommended for local Windows development
- in some environments, Node 22 can trigger a `spawn EPERM` error when running `next dev`
- the frontend defaults to Indonesian (`id`) and includes a language switcher for Indonesian/English

### 3. Run Both Together

Helper scripts are available in `scripts/`:

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

## Environment Configuration

Frontend reads:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENTID`

Frontend locale behavior:

- default locale is `id`
- supported frontend locales are `id` and `en`
- the selected locale is persisted in cookies/local storage
- frontend requests send `Accept-Language`

The backend automatically loads `be/.env`.

A backend example file is provided at `be/.env.example`, including:

- Django core settings
- SQLite/PostgreSQL database settings
- JWT settings
- CORS settings
- media/static settings
- i18n settings
- SSO settings, including `SSO_PUBLIC_KEY_PATH`

Backend i18n behavior:

- Django locale middleware is enabled
- model labels/help text are prepared with `gettext_lazy`
- supported backend languages are `en` and `id`
- project translation files can be stored under `be/locale/`

Backend database support:

- SQLite by default
- PostgreSQL when `USE_POSTGRES=True`

Minimal PostgreSQL example:

```env
USE_POSTGRES=True
DB_ENGINE=django.db.backends.postgresql
DB_NAME=integrated_farming
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

The SSO public key is best stored at:

```text
be/authentication/keys/public.pem
```

Or at another location referenced through `SSO_PUBLIC_KEY_PATH`.

## Authentication and RBAC

Current auth/RBAC architecture:

- authentication is proxied to Arnatech SSO
- active permission enforcement is based on granular SSO permissions
- legacy Django roles are no longer used as the active access-control source

## Codebase Status

Some older features are still preserved as safe placeholders because their original API dependencies are no longer present in the active repository:

- `proyek` module
- `kepemilikan` module
- `test-api` page

## Recommended Next Steps

- add real backend tests for stock and profit-distribution flows
- tighten frontend/backend endpoint consistency
- rebuild the project/ownership modules only if the business still requires them
