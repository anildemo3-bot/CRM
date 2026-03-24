# Niche CRM - Full Setup Script (Windows)
# Run from the crm/ root directory: .\setup.ps1

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$env:PATH = "$pgBin;$env:PATH"

Write-Host "=== Niche CRM Setup ===" -ForegroundColor Cyan

# Ask for postgres password
$pgPassword = Read-Host "Enter your PostgreSQL 'postgres' superuser password" -AsSecureString
$pgPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)
$env:PGPASSWORD = $pgPass

# Test connection
Write-Host "`n[1/5] Testing database connection..." -ForegroundColor Yellow
$test = & "$pgBin\psql.exe" -U postgres -h localhost -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to PostgreSQL. Check your password." -ForegroundColor Red
    Write-Host "Error: $test"
    exit 1
}
Write-Host "✅ Connected to PostgreSQL" -ForegroundColor Green

# Create user and database
Write-Host "`n[2/5] Creating database user and database..." -ForegroundColor Yellow
& "$pgBin\psql.exe" -U postgres -h localhost -c "CREATE USER ""user"" WITH PASSWORD 'password';" 2>&1 | Out-Null
& "$pgBin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE crm_db OWNER ""user"";" 2>&1 | Out-Null
& "$pgBin\psql.exe" -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE crm_db TO ""user"";" 2>&1 | Out-Null
Write-Host "✅ Database 'crm_db' ready" -ForegroundColor Green

# Run Prisma migrations
Write-Host "`n[3/5] Running database migrations..." -ForegroundColor Yellow
Set-Location backend
node node_modules/prisma/build/index.js migrate deploy 2>&1
if ($LASTEXITCODE -ne 0) {
    # Try dev migrate if deploy fails (first time)
    node node_modules/prisma/build/index.js migrate dev --name init 2>&1
}
Write-Host "✅ Migrations complete" -ForegroundColor Green

# Run seed
Write-Host "`n[4/5] Seeding demo data..." -ForegroundColor Yellow
node -r ./node_modules/ts-node/register prisma/seed.ts
Write-Host "✅ Demo data seeded (login: nic@niche.com / niche123)" -ForegroundColor Green

# Done
Set-Location ..
Write-Host "`n[5/5] Setup complete!" -ForegroundColor Green
Write-Host "`n=== START THE APP ===" -ForegroundColor Cyan
Write-Host "Backend:  cd backend && npm run start:dev" -ForegroundColor White
Write-Host "Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "`nFrontend runs at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API at:   http://localhost:3010" -ForegroundColor Yellow
Write-Host "Login: nic@niche.com / niche123" -ForegroundColor Green
