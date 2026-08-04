$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Api = Join-Path $Root "apps\api-laravel"
$Web = Join-Path $Root "apps\web-react"

if (-not (Test-Path (Join-Path $Api ".env"))) {
    Copy-Item (Join-Path $Api ".env.example") (Join-Path $Api ".env")
    Write-Host "Created apps/api-laravel/.env. Fill the private Supabase values before running Laravel." -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $Web ".env.local"))) {
    Copy-Item (Join-Path $Web ".env.example") (Join-Path $Web ".env.local")
    Write-Host "Created apps/web-react/.env.local for local Laravel." -ForegroundColor Green
}

Write-Host "Local files are ready." -ForegroundColor Green
Write-Host "Backend: cd apps\api-laravel; php artisan config:clear; php artisan serve"
Write-Host "Frontend: cd apps\web-react; npm run dev"
