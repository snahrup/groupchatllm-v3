# GroupChatLLM v3 Shutdown Script
Clear-Host

Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "                    GroupChatLLM v3 - Shutdown Sequence" -ForegroundColor White
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Initiating graceful shutdown..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop Backend Services
Write-Host "[1/3] " -ForegroundColor White -NoNewline
Write-Host "Stopping Backend Services..."

$backendKilled = $false
$connections = netstat -ano | Select-String ":8000 " | ForEach-Object {
    $parts = $_ -split '\s+'
    $parts[-1]
} | Where-Object { $_ -ne '0' } | Select-Object -Unique

foreach ($processId in $connections) {
    try {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "   [OK] " -ForegroundColor Green -NoNewline
        Write-Host "Backend process terminated (PID: $processId)"
        $backendKilled = $true
    } catch {
        # Process might have already exited
    }
}

if (!$backendKilled) {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "No backend processes found"
}

# Step 2: Stop Frontend Services
Write-Host "[2/3] " -ForegroundColor White -NoNewline
Write-Host "Stopping Frontend Services..."

$frontendKilled = $false
$connections = netstat -ano | Select-String ":5173 " | ForEach-Object {
    $parts = $_ -split '\s+'
    $parts[-1]
} | Where-Object { $_ -ne '0' } | Select-Object -Unique

foreach ($processId in $connections) {
    try {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "   [OK] " -ForegroundColor Green -NoNewline
        Write-Host "Frontend process terminated (PID: $processId)"
        $frontendKilled = $true
    } catch {
        # Process might have already exited
    }
}

if (!$frontendKilled) {
    Write-Host "   [!] " -ForegroundColor Yellow -NoNewline
    Write-Host "No frontend processes found"
}

# Step 3: Final cleanup
Write-Host "[3/3] " -ForegroundColor White -NoNewline
Write-Host "Final cleanup..."

# Kill any remaining processes with our window titles
Get-Process | Where-Object { $_.MainWindowTitle -like "*GroupChatLLM*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "   [OK] " -ForegroundColor Green -NoNewline
Write-Host "Cleanup complete"
Write-Host ""

Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "               All GroupChatLLM services have been stopped" -ForegroundColor Green
Write-Host ""
Write-Host "                     Thank you for using GroupChatLLM v3" -ForegroundColor White
Write-Host ""
Write-Host "=================================================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"