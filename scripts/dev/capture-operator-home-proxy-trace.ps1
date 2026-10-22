# TB-2304 (performance) — Scaffold an operator-home proxy trace JSON from clipboard or manual paths.
param(
    [string]$OutputPath = "",
    [string[]]$Path = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$uiRoot = Join-Path $repoRoot "archlucid-ui"
$defaultOutput = Join-Path $uiRoot "scripts\fixtures\operator-home-startup-proxy-trace.capture.json"

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = $defaultOutput
}

$resolvedPaths = @()

if ($Path.Count -gt 0) {
    $resolvedPaths = $Path
}
elseif (Get-Command Get-Clipboard -ErrorAction SilentlyContinue) {
    $clipboard = Get-Clipboard -Raw

    if (-not [string]::IsNullOrWhiteSpace($clipboard)) {
        $resolvedPaths = $clipboard -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
    }
}

if ($resolvedPaths.Count -eq 0) {
    Write-Error "No paths supplied. Pass -Path or copy proxy URLs (one per line) to the clipboard."
}

$entries = @()
$startedAtMs = 0

foreach ($rawPath in $resolvedPaths) {
    $entries += [ordered]@{
        path = $rawPath
        method = "GET"
        startedAtMs = $startedAtMs
    }
    $startedAtMs += 60
}

$capture = [ordered]@{
    capturedUtc = (Get-Date).ToUniversalTime().ToString("o")
    route = "/"
    entries = $entries
}

$json = ($capture | ConvertTo-Json -Depth 6)
$directory = Split-Path -Parent $OutputPath

if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

Set-Content -LiteralPath $OutputPath -Value $json -Encoding utf8
Write-Host "Wrote operator-home proxy trace capture: $OutputPath"
Write-Host "Compare: cd archlucid-ui; npm run check:operator-home-proxy-trace -- --trace $OutputPath"
