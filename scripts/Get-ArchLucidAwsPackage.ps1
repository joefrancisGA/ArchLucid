<#
.SYNOPSIS
    Collects read-only AWS inventory for ArchLucid ingestion (schema-versioned ZIP).

.NOTES
    - No ArchLucid credentials run in your AWS account. Output is uploaded by you to ArchLucid.
    - Read-only collection via AWS CLI (Resource Explorer search or Config select-resources when available).
    - Upload the resulting ZIP to POST /v1/extractor/aws/upload.
#>
#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string] $AccountId = "",

    [Parameter(Mandatory = $true)]
    [string] $OutputPath,

    [Parameter(Mandatory = $false)]
    [string[]] $Regions = @(),

    [Parameter(Mandatory = $false)]
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string] $Path, [string] $Content)
{
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Get-AwsCliVersion
{
    try {
        $raw = aws --version 2>&1
        return [string]$raw
    }
    catch {
        return "unknown"
    }
}

$resolvedAccountId = $AccountId

if ([string]::IsNullOrWhiteSpace($resolvedAccountId)) {
    if ($DryRun) {
        $resolvedAccountId = "000000000000"
    }
    else {
        $identityJson = aws sts get-caller-identity --output json
        $identity = $identityJson | ConvertFrom-Json
        $resolvedAccountId = [string]$identity.Account
    }
}

$collectionTimestamp = (Get-Date).ToUniversalTime().ToString("o")
$scriptVersion = "1.0.0"
$collectorVersion = Get-AwsCliVersion

$resources = @()

if ($DryRun) {
    $resources = @(
        [pscustomobject]@{
            name         = "sample-web"
            resourceType = "AWS::EC2::Instance"
            location     = "us-east-1"
            sku          = "t3.micro"
        }
    )
}
else {
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        throw "AWS CLI (aws) is required. Install AWS CLI v2 and configure read-only credentials."
    }

    $searchRegions = @($Regions)

    if ($searchRegions.Count -eq 0) {
        $searchRegions = @("us-east-1")
    }

    foreach ($region in $searchRegions) {
        $queryJson = aws resource-explorer-2 search `
            --region $region `
            --query-string "arn:aws:*" `
            --max-results 50 `
            --output json 2>$null

        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($queryJson)) {
            continue
        }

        $parsed = $queryJson | ConvertFrom-Json

        foreach ($item in @($parsed.Resources)) {
            $resources += [pscustomobject]@{
                name         = [string]$item.Arn
                resourceType = [string]$item.ResourceType
                location     = [string]$region
                sku          = $null
            }
        }
    }
}

$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-aws-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

try {
    $manifest = [ordered]@{
        schemaVersion       = 1
        scriptVersion       = $scriptVersion
        collectionTimestamp = $collectionTimestamp
        cloudProvider       = "Aws"
        accountId           = $resolvedAccountId
        scope               = "account"
        switchesUsed        = @()
        collectorVersion    = $collectorVersion
    }

    $manifestPath = Join-Path $stagingDir "manifest.json"
    $resourcesPath = Join-Path $stagingDir "resources.json"
    $readmePath = Join-Path $stagingDir "README.txt"

    Write-Utf8NoBom $manifestPath (($manifest | ConvertTo-Json -Depth 6 -Compress))
    Write-Utf8NoBom $resourcesPath (($resources | ConvertTo-Json -Depth 6 -Compress))
    Write-Utf8NoBom $readmePath @"
ArchLucid AWS inventory package (read-only).
Upload this ZIP to POST /v1/extractor/aws/upload
Do not share outside your change-management policy.
"@

    if (-not (Test-Path -LiteralPath $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }

    $zipPath = if ($OutputPath.EndsWith(".zip", [StringComparison]::OrdinalIgnoreCase)) {
        $OutputPath
    }
    else {
        Join-Path $OutputPath "archlucid-aws-inventory.zip"
    }

    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPath -Force
    Write-Host "Wrote AWS inventory ZIP: $zipPath"
}
finally {
    if (Test-Path -LiteralPath $stagingDir) {
        Remove-Item -LiteralPath $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
