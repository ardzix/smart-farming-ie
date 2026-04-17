@echo off
echo ========================================
echo   Fix Migrations __init__.py
echo ========================================
echo.

REM Buat __init__.py untuk semua folder migrations
echo [1/3] Membuat __init__.py...

if not exist asset\migrations mkdir asset\migrations
echo. > asset\migrations\__init__.py
echo [OK] asset\migrations\__init__.py

if not exist ownership\migrations mkdir ownership\migrations
echo. > ownership\migrations\__init__.py
echo [OK] ownership\migrations\__init__.py

if not exist expense\migrations mkdir expense\migrations
echo. > expense\migrations\__init__.py
echo [OK] expense\migrations\__init__.py

if not exist authentication\migrations mkdir authentication\migrations
echo. > authentication\migrations\__init__.py
echo [OK] authentication\migrations\__init__.py

if not exist investor\migrations mkdir investor\migrations
echo. > investor\migrations\__init__.py
echo [OK] investor\migrations\__init__.py

if not exist funding\migrations mkdir funding\migrations
echo. > funding\migrations\__init__.py
echo [OK] funding\migrations\__init__.py

if not exist funding_source\migrations mkdir funding_source\migrations
echo. > funding_source\migrations\__init__.py
echo [OK] funding_source\migrations\__init__.py

if not exist project\migrations mkdir project\migrations
echo. > project\migrations\__init__.py
echo [OK] project\migrations\__init__.py

if not exist production\migrations mkdir production\migrations
echo. > production\migrations\__init__.py
echo [OK] production\migrations\__init__.py

if not exist profit_distribution\migrations mkdir profit_distribution\migrations
echo. > profit_distribution\migrations\__init__.py
echo [OK] profit_distribution\migrations\__init__.py

if not exist distribution_detail\migrations mkdir distribution_detail\migrations
echo. > distribution_detail\migrations\__init__.py
echo [OK] distribution_detail\migrations\__init__.py

if not exist reporting\migrations mkdir reporting\migrations
echo. > reporting\migrations\__init__.py
echo [OK] reporting\migrations\__init__.py

if not exist dashboard\migrations mkdir dashboard\migrations
echo. > dashboard\migrations\__init__.py
echo [OK] dashboard\migrations\__init__.py

echo.
echo [2/3] Membuat migrations...
python manage.py makemigrations
if %errorlevel% neq 0 (
    echo [ERROR] makemigrations gagal!
    echo.
    echo Coba jalankan: pip install --upgrade django
    pause
    exit /b 1
)

echo.
echo [3/3] Apply migrations...
python manage.py migrate
if %errorlevel% neq 0 (
    echo [ERROR] migrate gagal!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BERHASIL!
echo ========================================
echo.
echo Langkah selanjutnya:
echo 1. python manage.py createsuperuser
echo 2. python manage.py runserver
echo.
pause