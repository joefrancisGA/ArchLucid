# Mirrors deploy/hosted-prod-terraform into infra/terraform/prod (authoritative hosted root per IAC_RUNTIME_PARITY.md).
param(
    [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Source = Join-Path $Root 'deploy/hosted-prod-terraform'
$Target = Join-Path $Root 'infra/terraform/prod'

if (-not (Test-Path -LiteralPath $Source)) {
    throw "Source scaffold missing: $Source"
}

if (-not (Test-Path -LiteralPath $Target)) {
    New-Item -ItemType Directory -Path $Target -Force | Out-Null
}

Get-ChildItem -LiteralPath $Source -File | ForEach-Object {
    $destination = Join-Path $Target $_.Name

    if ($WhatIf) {
        Write-Host "Would copy $($_.FullName) -> $destination"
        return
    }

    Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
}

$sourceNames = @(Get-ChildItem -LiteralPath $Source -File | ForEach-Object { $_.Name })
Get-ChildItem -LiteralPath $Target -File -ErrorAction SilentlyContinue | ForEach-Object {
    if ($sourceNames -contains $_.Name) {
        return
    }

    if ($WhatIf) {
        Write-Host "Would remove stale target file $($_.FullName)"
        return
    }

    Remove-Item -LiteralPath $_.FullName -Force
}

Write-Host "Synced hosted production Terraform scaffold to $Target"
