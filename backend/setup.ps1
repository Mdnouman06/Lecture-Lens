# LectureLens Python Environment Setup Script
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " LectureLens Python AI Backend Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CurrentDir

# Locate Python 3
$PythonCmd = $null
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
} elseif (Get-Command "py" -ErrorAction SilentlyContinue) {
    $PythonCmd = "py -3"
}

if (-not $PythonCmd) {
    Write-Host "[!] Python 3 not detected on PATH." -ForegroundColor Yellow
    Write-Host "    Please install Python 3.10-3.12 from python.org or Microsoft Store." -ForegroundColor Yellow
    Write-Host "    Ensure 'Add Python to PATH' is checked during installation." -ForegroundColor Yellow
    Exit 1
}

Write-Host "[+] Using Python command: $PythonCmd" -ForegroundColor Green

# Create Virtual Environment if missing: python -m venv
if (-not (Test-Path "$CurrentDir\venv")) {
    Write-Host "[+] Creating virtual environment in .\venv..." -ForegroundColor Cyan
    & $PythonCmd -m venv "$CurrentDir\venv"
} else {
    Write-Host "[+] Virtual environment .\venv already exists." -ForegroundColor Green
}

# Activate & Install Dependencies
$VenvPip = "$CurrentDir\venv\Scripts\pip.exe"
if (Test-Path $VenvPip) {
    Write-Host "[+] Upgrading pip and installing requirements..." -ForegroundColor Cyan
    & $VenvPip install --upgrade pip
    & $VenvPip install -r "$CurrentDir\requirements.txt"
    Write-Host "[✓] Setup complete! You can now run .\run.ps1 to start the server." -ForegroundColor Green
} else {
    Write-Host "[!] Failed to locate venv pip at $VenvPip" -ForegroundColor Red
    Exit 1
}
