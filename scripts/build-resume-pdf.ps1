# Rebuilds assets/files/Janno-Nuyles-Resume.pdf from resume.html using the page's print styles.
# Run after editing resume.html:  powershell -File scripts/build-resume-pdf.ps1
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "resume.html"
$outDir = Join-Path $root "assets\files"
$output = Join-Path $outDir "Janno-Nuyles-Resume.pdf"

$browser = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browser) { throw "Chrome or Edge is required to build the PDF." }

New-Item -ItemType Directory -Force $outDir | Out-Null
$url = ([System.Uri]$source).AbsoluteUri

& $browser --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 "--print-to-pdf=$output" $url | Out-Null
if (-not (Test-Path $output)) { throw "PDF was not created." }
Write-Output "Wrote $output"
