# Tech Hub setup helper for Windows PowerShell
# Run each command manually if something fails.

Write-Host "Installing React dependencies..."
cd apps/web-react
npm install
cd ../..

Write-Host "Next steps:"
Write-Host "1. Create real Laravel project with composer create-project laravel/laravel apps/api-laravel"
Write-Host "2. Copy starter Laravel files into it"
Write-Host "3. Add Supabase DB values to apps/api-laravel/.env"
Write-Host "4. Run php artisan migrate"
Write-Host "5. For Flutter, run flutter create apps/mobile-flutter if android/ios folders are missing"
