<#
.SYNOPSIS
  Safely re-render all architecture diagram SVG/PNG (via temp .mmd copies), then regenerate Full + Buyer + Security handbook DOCX.

.EXAMPLE
  .\scripts\docs\release-architecture-handbook.ps1
#>
[CmdletBinding()]
param(
  [string]$RepoRoot = '',
  [switch]$SkipRender,
  [switch]$SkipDocx
)

Set-StrictMode -Off
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

Set-Location -LiteralPath $RepoRoot

$diagrams = Join-Path $RepoRoot 'docs\architecture\architecture_diagrams'
$tmpRoot = Join-Path $env:TEMP 'archlucid-mmd-release'
New-Item -ItemType Directory -Force -Path $tmpRoot | Out-Null

if (-not $SkipRender) {
  $mmds = @(Get-ChildItem -LiteralPath $diagrams -Filter '*.mmd' -File)

  foreach ($mmd in $mmds) {
    $base = $mmd.BaseName
    $svg = Join-Path $diagrams ($base + '.svg')
    $png = Join-Path $diagrams ($base + '.png')
    $tmp = Join-Path $tmpRoot ($base + '.mmd')
    Copy-Item -LiteralPath $mmd.FullName -Destination $tmp -Force

    Write-Host ("Render {0}" -f $base)

    if (-not (Test-Path -LiteralPath $svg)) {
      npx --yes @mermaid-js/mermaid-cli@11 -i $tmp -o $svg

      if ($LASTEXITCODE -ne 0) {
        throw "SVG render failed for $base"
      }
    }

    if (-not (Test-Path -LiteralPath $png)) {
      npx --yes @mermaid-js/mermaid-cli@11 -i $tmp -o $png -b white

      if ($LASTEXITCODE -ne 0) {
        throw "PNG render failed for $base"
      }
    }

    # mermaid-cli has deleted in-repo sources on Windows in rare cases; restore from the temp copy.
    if (-not (Test-Path -LiteralPath $mmd.FullName)) {
      if (Test-Path -LiteralPath $tmp) {
        Copy-Item -LiteralPath $tmp -Destination $mmd.FullName -Force
        Write-Host ("Restored source .mmd from temp: {0}" -f $base)
      }
      else {
        throw "Source .mmd disappeared during render and temp copy missing: $base"
      }
    }
  }
}

$gen = Join-Path $RepoRoot 'scripts\docs\generate-architecture-handbook-docx.ps1'

if (-not $SkipDocx) {
  & $gen -Pack Full -SkipPngRender

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  & $gen -Pack Buyer -SkipPngRender

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  & $gen -Pack Security -SkipPngRender

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

python (Join-Path $RepoRoot 'scripts\ci\check_architecture_diagrams_drift.py')
exit $LASTEXITCODE
