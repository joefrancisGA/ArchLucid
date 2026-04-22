#Requires -Version 7.0
<#
.SYNOPSIS
  Assembles docs into dist/procurement-pack/ and dist/procurement-pack.zip with manifest.json (SHA-256 per file).

.NOTES
  Canonical legal text stays in docs/ — this script copies excerpts only. See docs/go-to-market/TRUST_CENTER.md.
#>
$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$stage = Join-Path $repoRoot "dist/procurement-pack"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

$files = @(
  @{ Src = "docs/go-to-market/TRUST_CENTER.md"; Dst = "TRUST_CENTER.md" },
  @{ Src = "docs/go-to-market/SUBPROCESSORS.md"; Dst = "SUBPROCESSORS.md" },
  @{ Src = "docs/go-to-market/SLA_SUMMARY.md"; Dst = "SLA_SUMMARY.md" },
  @{ Src = "docs/go-to-market/DPA_TEMPLATE.md"; Dst = "DPA_TEMPLATE.md" },
  @{ Src = "docs/security/CAIQ_LITE_2026.md"; Dst = "CAIQ_LITE_2026.md" },
  @{ Src = "docs/security/SIG_CORE_2026.md"; Dst = "SIG_CORE_2026.md" }
)

$manifest = @()
foreach ($f in $files) {
  $srcPath = Join-Path $repoRoot $f.Src
  if (-not (Test-Path $srcPath)) { throw "Missing source file: $($f.Src)" }
  $dstPath = Join-Path $stage $f.Dst
  Copy-Item $srcPath $dstPath
  $hash = (Get-FileHash $dstPath -Algorithm SHA256).Hash.ToLowerInvariant()
  $manifest += [ordered]@{ path = $f.Dst; source = $f.Src; sha256 = $hash }
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $stage "manifest.json") -Encoding utf8

$zipPath = Join-Path $repoRoot "dist/procurement-pack.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zipPath -Force
Write-Host "Wrote $zipPath"
