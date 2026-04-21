@echo off
setlocal

set ROOT=%~dp0..
set BE_DIR=%ROOT%\be
set FE_DIR=%ROOT%\fe

start "Integrated Farming BE" powershell -NoExit -Command "Set-Location '%BE_DIR%'; if (Test-Path '.venv\Scripts\python.exe') { & '.venv\Scripts\python.exe' manage.py runserver } elseif (Test-Path 'venv\Scripts\python.exe') { & 'venv\Scripts\python.exe' manage.py runserver } else { python manage.py runserver }"
start "Integrated Farming FE" powershell -NoExit -Command "Set-Location '%FE_DIR%'; npm run dev"

echo Backend and frontend started in separate windows.
endlocal
