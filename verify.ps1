# GroupChatLLM v3 System Verification Script
Clear-Host

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "                    GroupChatLLM v3 - System Verification" -ForegroundColor White
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..."
try {
    $pythonVersion = & python --version 2>&1
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host $pythonVersion
} catch {
    Write-Host "   [X] " -ForegroundColor Red -NoNewline
    Write-Host "Python not found in PATH"
    Write-Host "        Please install Python 3.11 or later"
}

# Check Node.js
Write-Host "Checking Node.js installation..."
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Node.js $nodeVersion found"
} catch {
    Write-Host "   [X] " -ForegroundColor Red -NoNewline
    Write-Host "Node.js not found in PATH"
    Write-Host "        Please install Node.js 18 or later"
}
# Check virtual environment
Write-Host "Checking virtual environment..."
$venvPath = Join-Path $BaseDir ".venv\Scripts\python.exe"
if (Test-Path $venvPath) {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Virtual environment exists"
} else {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "Virtual environment not found (will be created on first launch)"
}

# Check backend structure
Write-Host "Checking backend structure..."
$backendMain = Join-Path $BaseDir "backend\main.py"
if (Test-Path $backendMain) {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Backend main.py found"
} else {
    Write-Host "   [X] " -ForegroundColor Red -NoNewline
    Write-Host "Backend main.py missing"
}

# Check frontend structure
Write-Host "Checking frontend structure..."
$frontendPackage = Join-Path $BaseDir "frontend\package.json"
if (Test-Path $frontendPackage) {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Frontend package.json found"
} else {
    Write-Host "   [X] " -ForegroundColor Red -NoNewline
    Write-Host "Frontend package.json missing"
}

# Check for .env file
Write-Host "Checking environment configuration..."
$envFile = Join-Path $BaseDir "backend\.env"
if (Test-Path $envFile) {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Backend .env file found"
} else {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "Backend .env file missing"
    Write-Host "        Copy backend\.env.example to backend\.env and add your API keys"
}

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Files:" -ForegroundColor White
Write-Host "   launch.bat     " -ForegroundColor Cyan -NoNewline
Write-Host "- Main launcher (production-ready)"
Write-Host "   shutdown.bat   " -ForegroundColor Cyan -NoNewline
Write-Host "- Graceful shutdown"
Write-Host "   verify.bat     " -ForegroundColor Cyan -NoNewline
Write-Host "- This verification script"
Write-Host "   README.md      " -ForegroundColor Cyan -NoNewline
Write-Host "- Project documentation"
Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"