# LectureLens Local AI Bridge Server Launcher
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting LectureLens FastAPI Service" -ForegroundColor Cyan
Write-Host " Target: http://localhost:8000" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CurrentDir

$RootVenvPython = "$CurrentDir\..\.venv\Scripts\python.exe"
$LocalVenvPython = "$CurrentDir\venv\Scripts\python.exe"

if (Test-Path $RootVenvPython) {
    & $RootVenvPython -m uvicorn main:app --reload --port 8000
} elseif (Test-Path $LocalVenvPython) {
    & $LocalVenvPython -m uvicorn main:app --reload --port 8000
} elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
    python -m uvicorn main:app --reload --port 8000
} else {
    Write-Host "[!] Virtual environment not found. Please run .\setup.ps1 first." -ForegroundColor Red
}
