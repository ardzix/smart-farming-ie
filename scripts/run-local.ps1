$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$BeDir = Join-Path $Root "be"
$FeDir = Join-Path $Root "fe"

$backendCommand = @"
Set-Location '$BeDir'
if (Test-Path '.venv\Scripts\python.exe') { & '.venv\Scripts\python.exe' manage.py runserver }
elseif (Test-Path 'venv\Scripts\python.exe') { & 'venv\Scripts\python.exe' manage.py runserver }
else { python manage.py runserver }
"@

$frontendCommand = @"
Set-Location '$FeDir'
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null

Write-Host "Backend and frontend started in separate PowerShell windows."
