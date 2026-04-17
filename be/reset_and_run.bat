@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================================
echo    RESET DATABASE ^& SEED ROLE - LAHAN PINTAR
echo ========================================================
echo.
echo [WARNING] Script ini akan:
echo   1. MENGHAPUS database (db.sqlite3)
echo   2. Membuat tabel baru (migrate)
echo   3. Seed Role dan Superuser default
echo.
echo Setelah selesai, jalankan: python seed_demo_data.py
echo.
set /p confirm="Lanjutkan? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Dibatalkan.
    pause
    exit /b
)

:: --- 1. CARI FOLDER BACKEND ---
echo.
echo [1/4] Mencari file manage.py...
set "BACKEND_PATH="
for /r %%i in (manage.py) do (
    set "BACKEND_PATH=%%~dpi"
    goto :FoundBackend
)

:FoundBackend
if not defined BACKEND_PATH (
    echo [ERROR] File 'manage.py' tidak ditemukan!
    echo Pastikan Anda menjalankan script ini dari folder root proyek.
    pause
    exit /b
)
set "BACKEND_PATH=%BACKEND_PATH:~0,-1%"
echo        ✓ Backend ditemukan: "%BACKEND_PATH%"

:: --- 2. RESET DATABASE ---
echo.
echo [2/5] Mereset Database...
cd /d "%BACKEND_PATH%"

if exist "db.sqlite3" (
    del "db.sqlite3"
    echo        ✓ Database lama dihapus
) else (
    echo        ℹ Tidak ada database lama
)

:: --- 3. HAPUS FILE MIGRATIONS (OPSIONAL) ---
echo.
echo [3/5] Membersihkan file migrations lama (opsional)...
set CLEAN_MIGRATIONS=N
set /p CLEAN_MIGRATIONS="Hapus file migrations lama? (Y/N, default=N): "

if /i "%CLEAN_MIGRATIONS%"=="Y" (
    echo        - Menghapus migration files...
    for /d %%d in (asset\migrations authentication\migrations dashboard\migrations distribution_detail\migrations expense\migrations funding\migrations funding_source\migrations investor\migrations ownership\migrations production\migrations profit_distribution\migrations project\migrations reporting\migrations) do (
        if exist "%%d" (
            for %%f in ("%%d\*.py") do (
                if not "%%~nxf"=="__init__.py" (
                    del "%%f" 2>nul
                    echo           • %%f dihapus
                )
            )
        )
    )
    echo        ✓ Migration files dibersihkan
) else (
    echo        ℹ Melewati pembersihan migrations
)

:: --- 4. MIGRATE ---
echo.
echo [4/5] Membuat Tabel Baru (Migrate)...
python manage.py makemigrations
if %errorlevel% neq 0 (
    echo        ❌ Gagal membuat migrations!
    pause
    exit /b 1
)

python manage.py migrate
if %errorlevel% neq 0 (
    echo        ❌ Gagal migrate!
    pause
    exit /b 1
)
echo        ✓ Tabel berhasil dibuat

:: --- 5. SEED ROLE & SUPERUSER ---
echo.
echo [5/5] Mengisi Role ^& Superuser...

python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_land.settings'); import django; django.setup(); from django.contrib.auth import get_user_model; from authentication.models import Role; User = get_user_model(); roles_data = [('Superadmin', 'Full system access'), ('Admin', 'Administrative access'), ('Operator', 'Operational data entry'), ('Investor', 'Investor portal access'), ('Viewer', 'Read-only access')]; [Role.objects.get_or_create(name=r[0], defaults={'description': r[1]}) for r in roles_data]; print('       ✓ 5 Role berhasil dibuat'); superadmin_role = Role.objects.get(name='Superadmin'); User.objects.create_superuser('admin', 'admin@lahanhijau.com', 'admin', role=superadmin_role) if not User.objects.filter(username='admin').exists() else print('       ℹ Superuser sudah ada'); print('       ✓ Superuser: admin / admin (Role: Superadmin)')"

if %errorlevel% neq 0 (
    echo        ❌ Gagal seed data!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  ✅ RESET DATABASE SELESAI!
echo ========================================================
echo.
echo 📝 Yang sudah dibuat:
echo    - Role: Superadmin, Admin, Operator, Investor, Viewer
echo    - User: admin / admin (Superadmin)
echo.
echo 🚀 Langkah Selanjutnya:
echo    1. python seed_demo_data.py (untuk data demo lengkap)
echo    2. python manage.py runserver
echo    3. Login sebagai 'admin' / 'admin'
echo.
echo ========================================================
pause