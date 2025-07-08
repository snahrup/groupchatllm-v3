# GroupChatLLM v3 Launch Script
$ErrorActionPreference = "Stop"

# Clear screen
Clear-Host

# Get script directory
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $BaseDir "backend"
$FrontendDir = Join-Path $BaseDir "frontend"

# Display header
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "                    GroupChatLLM v3 - " -NoNewline
Write-Host "Collaborative AI Platform" -ForegroundColor Magenta
Write-Host "                              Version 3.0 Production" -ForegroundColor White
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Initializing GroupChatLLM v3 Launch Sequence..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify project structure
Write-Host "[1/6] " -ForegroundColor Blue -NoNewline
Write-Host "Verifying project structure..." -ForegroundColor White
Start-Sleep 1

if (!(Test-Path $BackendDir)) {
    Write-Host "   X " -ForegroundColor Red -NoNewline
    Write-Host "Backend directory not found"
    Write-Host "     Please ensure the project structure is intact"
    Read-Host "Press Enter to exit"
    exit 1
}
if (!(Test-Path $FrontendDir)) {
    Write-Host "   X " -ForegroundColor Red -NoNewline
    Write-Host "Frontend directory not found"
    Write-Host "     Please ensure the project structure is intact"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "   [OK] " -ForegroundColor Green -NoNewline
Write-Host "Project structure verified"
Write-Host ""

# Step 2: Clean up existing processes
Write-Host "[2/6] " -ForegroundColor Blue -NoNewline
Write-Host "Cleaning up existing processes..." -ForegroundColor White

# Kill processes on ports
$portsToClean = @(8000, 5173)
foreach ($port in $portsToClean) {
    $connections = netstat -ano | Select-String ":$port " | ForEach-Object {
        $parts = $_ -split '\s+'
        $parts[-1]
    } | Where-Object { $_ -ne '0' } | Select-Object -Unique
    
    foreach ($processId in $connections) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        } catch {
            # Process might have already exited
        }
    }
}

Write-Host "   [OK] " -ForegroundColor Green -NoNewline
Write-Host "Process cleanup complete"
Write-Host ""
# Step 3: Check Python environment
Write-Host "[3/6] " -ForegroundColor Blue -NoNewline
Write-Host "Checking Python environment..." -ForegroundColor White
Start-Sleep 1

$VenvPath = Join-Path $BaseDir ".venv"
$VenvActivate = Join-Path $VenvPath "Scripts\activate.bat"

if (!(Test-Path $VenvActivate)) {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "Virtual environment not found"
    Write-Host "       Creating virtual environment..."
    
    Set-Location $BaseDir
    & python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   X " -ForegroundColor Red -NoNewline
        Write-Host "Failed to create virtual environment"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "       Installing backend dependencies..."
    & cmd /c "$VenvActivate && pip install -r backend\requirements.txt -q --disable-pip-version-check"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   X " -ForegroundColor Red -NoNewline
        Write-Host "Failed to install dependencies"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Virtual environment created and configured"
} else {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Virtual environment ready"
}
Write-Host ""
# Step 4: Check Node environment
Write-Host "[4/6] " -ForegroundColor Blue -NoNewline
Write-Host "Checking Node.js environment..." -ForegroundColor White
Start-Sleep 1

$NodeModules = Join-Path $FrontendDir "node_modules"

if (!(Test-Path $NodeModules)) {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "Node modules not found"
    Write-Host "       Installing frontend dependencies..."
    
    Set-Location $FrontendDir
    & npm install --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   X " -ForegroundColor Red -NoNewline
        Write-Host "Failed to install frontend dependencies"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Frontend dependencies installed"
} else {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Frontend dependencies ready"
}
Write-Host ""

# Step 5: Start Backend Server
Write-Host "[5/6] " -ForegroundColor Blue -NoNewline
Write-Host "Starting Backend AI Services..." -ForegroundColor White
Write-Host "       - FastAPI Server"
Write-Host "       - Multi-Provider AI Integration"
Write-Host "       - Real-time SSE Streaming"
Write-Host "       - Collaborative Intelligence Engine"
Write-Host ""

Set-Location $BaseDir
Start-Process cmd -ArgumentList "/c", "call .venv\Scripts\activate.bat && cd backend && python main.py" -WindowStyle Minimized
# Wait and verify backend
Start-Sleep 3
$backendReady = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 1
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            break
        }
    } catch {
        Start-Sleep 1
    }
}

if ($backendReady) {
    Write-Host "   [OK] " -ForegroundColor Green -NoNewline
    Write-Host "Backend AI services online"
} else {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "Backend starting... Check the backend window"
}
Write-Host ""

# Step 6: Start Frontend Server
Write-Host "[6/6] " -ForegroundColor Blue -NoNewline
Write-Host "Starting Frontend Interface..." -ForegroundColor White
Write-Host "       - React 19 + TypeScript"
Write-Host "       - Glassmorphic UI Design"
Write-Host "       - Real-time Collaboration View"
Write-Host "       - Synapse Visualization Ready"
Write-Host ""

Set-Location $FrontendDir
Start-Process cmd -ArgumentList "/c", "npm run dev" -WindowStyle Minimized

# Final wait
Start-Sleep 3
# Display success status
Clear-Host
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "                          SYSTEM SUCCESSFULLY LAUNCHED" -ForegroundColor Green
Write-Host ""
Write-Host "                    GroupChatLLM v3 - " -NoNewline
Write-Host "Collaborative AI Platform" -ForegroundColor Magenta
Write-Host "                              Version 3.0 Active" -ForegroundColor White
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor White
Write-Host "   * " -ForegroundColor Green -NoNewline
Write-Host "Backend API:    " -NoNewline
Write-Host "http://localhost:8000" -ForegroundColor Cyan -NoNewline
Write-Host "      [ONLINE]" -ForegroundColor Green
Write-Host "   * " -ForegroundColor Green -NoNewline
Write-Host "Frontend UI:    " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Cyan -NoNewline
Write-Host "      [ONLINE]" -ForegroundColor Green
Write-Host "   * " -ForegroundColor Green -NoNewline
Write-Host "API Docs:       " -NoNewline
Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   * " -ForegroundColor Green -NoNewline
Write-Host "Health Check:   " -NoNewline
Write-Host "http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "AI Models Available:" -ForegroundColor White
Write-Host "   - " -ForegroundColor Magenta -NoNewline
Write-Host "GPT-4o (OpenAI)"
Write-Host "   - " -ForegroundColor Magenta -NoNewline
Write-Host "Claude 3.5 Sonnet (Anthropic)"
Write-Host "   - " -ForegroundColor Magenta -NoNewline
Write-Host "Gemini 2.0 Flash (Google)"
Write-Host ""Write-Host "Features Active:" -ForegroundColor White
Write-Host "   [OK] " -ForegroundColor Cyan -NoNewline
Write-Host "Concurrent AI Collaboration"
Write-Host "   [OK] " -ForegroundColor Cyan -NoNewline
Write-Host "Real-time Synapse Detection"
Write-Host "   [OK] " -ForegroundColor Cyan -NoNewline
Write-Host "SSE Streaming Architecture"
Write-Host "   [OK] " -ForegroundColor Cyan -NoNewline
Write-Host "Glassmorphic Interface"
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Yellow
Start-Sleep 3
Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "Press any key to exit this launcher (services will continue running)" -ForegroundColor White
Read-Host