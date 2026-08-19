<#
.SYNOPSIS
    Collects read-only GCP inventory for ArchLucid ingestion (schema-versioned ZIP).

.NOTES
    - No ArchLucid credentials run in your GCP project. Output is uploaded by you to ArchLucid.
    - Read-only collection via gcloud asset inventory list.
    - Upload the resulting ZIP to POST /v1/extractor/gcp/upload.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string] $ProjectId = "",

    [Parameter(Mandatory = $true)]
    [string] $OutputPath,

    [Parameter(Mandatory = $false)]
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string] $Path, [string] $Content)
{
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Get-GcloudVersion
{
    try {
        $raw = gcloud --version 2>&1 | Select-Object -First 1
        return [string]$raw
    }
    catch {
        return "unknown"
    }
}

$resolvedProjectId = $ProjectId

if ([string]::IsNullOrWhiteSpace($resolvedProjectId)) {
    if ($DryRun) {
        $resolvedProjectId = "archlucid-sample-project"
    }
    else {
        $resolvedProjectId = (gcloud config get-value project 2>$null).Trim()
        if ([string]::IsNullOrWhiteSpace($resolvedProjectId)) {
            throw "ProjectId is required when gcloud default project is unset."
        }
    }
}

$collectionTimestamp = (Get-Date).ToUniversalTime().ToString("o")
$scriptVersion = "1.0.0"
$collectorVersion = Get-GcloudVersion

$resources = @()

if ($DryRun) {
    $resources = @(
        [pscustomobject]@{
            name         = "//compute.googleapis.com/projects/$resolvedProjectId/zones/us-central1-a/instances/sample-vm"
            resourceType = "compute.googleapis.com/Instance"
            location     = "us-central1"
            sku          = "e2-medium"
        }
    )
}
else {
    if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
        throw "Google Cloud SDK (gcloud) is required. Install gcloud and configure read-only credentials."
    }

    $assetJson = gcloud asset search-all-resources `
        --project=$resolvedProjectId `
        --limit=50 `
        --format=json 2>$null

    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($assetJson)) {
        throw "gcloud asset search-all-resources failed for project '$resolvedProjectId'."
    }

    $parsed = $assetJson | ConvertFrom-Json

    foreach ($item in @($parsed)) {
        $resources += [pscustomobject]@{
            name         = [string]$item.name
            resourceType = [string]$item.assetType
            location     = [string]$item.location
            sku          = $null
        }
    }
}

$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-gcp-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

try {
    $manifest = [ordered]@{
        schemaVersion       = 1
        scriptVersion       = $scriptVersion
        collectionTimestamp = $collectionTimestamp
        cloudProvider       = "Gcp"
        projectId           = $resolvedProjectId
        scope               = "project"
        switchesUsed        = @()
        collectorVersion    = $collectorVersion
    }

    $manifestPath = Join-Path $stagingDir "manifest.json"
    $resourcesPath = Join-Path $stagingDir "resources.json"
    $readmePath = Join-Path $stagingDir "README.txt"

    Write-Utf8NoBom $manifestPath (($manifest | ConvertTo-Json -Depth 6 -Compress))
    Write-Utf8NoBom $resourcesPath (($resources | ConvertTo-Json -Depth 6 -Compress))
    Write-Utf8NoBom $readmePath @"
ArchLucid GCP inventory package (read-only).
Upload this ZIP to POST /v1/extractor/gcp/upload
Do not share outside your change-management policy.
"@

    if (-not (Test-Path -LiteralPath $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }

    $zipPath = if ($OutputPath.EndsWith(".zip", [StringComparison]::OrdinalIgnoreCase)) {
        $OutputPath
    }
    else {
        Join-Path $OutputPath "archlucid-gcp-inventory.zip"
    }

    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPath -Force
    Write-Host "Wrote GCP inventory ZIP: $zipPath"
}
finally {
    if (Test-Path -LiteralPath $stagingDir) {
        Remove-Item -LiteralPath $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
