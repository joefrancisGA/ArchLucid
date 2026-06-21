# Restore and build ArchLucid.Api.Tests for OpenAPI snapshot checks with a repo-local NuGet cache
# and restore fingerprinting so repeat pre-push runs skip redundant restores.
#
# Usage (repo root):
#   .\scripts\ci\ensure_openapi_contract_build.ps1

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $Root

$CacheRoot = Join-Path $Root '.cache'
$NuGetPackages = Join-Path $CacheRoot 'nuget-packages'
$RestoreStamp = Join-Path $CacheRoot 'openapi-contract-restore.stamp'

New-Item -ItemType Directory -Force -Path $NuGetPackages | Out-Null
$env:NUGET_PACKAGES = $NuGetPackages

function Get-OpenApiContractRestoreFingerprint {
    $files = @(
        (Join-Path $Root 'global.json'),
        (Join-Path $Root 'Directory.Packages.props'),
        (Join-Path $Root 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj')
    )

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        foreach ($path in $files) {
            if (-not (Test-Path -LiteralPath $path)) {
                continue
            }

            $bytes = [System.IO.File]::ReadAllBytes($path)
            $sha.TransformBlock($bytes, 0, $bytes.Length, $null, 0) | Out-Null
        }

        $sha.TransformFinalBlock([byte[]]::new(0), 0, 0) | Out-Null
        return [BitConverter]::ToString($sha.Hash).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }
}

$fingerprint = Get-OpenApiContractRestoreFingerprint
$needsRestore = $true

if (Test-Path -LiteralPath $RestoreStamp) {
    $previous = (Get-Content -LiteralPath $RestoreStamp -Raw).Trim()

    if ($previous -eq $fingerprint) {
        $needsRestore = $false
    }
}

if ($needsRestore) {
    dotnet restore ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Set-Content -LiteralPath $RestoreStamp -Value $fingerprint -NoNewline
}

$rev = 'local'

try { $rev = (git rev-parse HEAD).Trim() }
catch { }

dotnet build ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj `
    --no-restore `
    -c Release `
    "/p:SourceRevisionId=$rev"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
