<#
.SYNOPSIS
  TB-2141 checklist: enable HotPathCache Redis L2 + ExpectedApiReplicaCount on staging/production (extends TB-2120 DEV).
#>
[CmdletBinding()]
param(
    [ValidateSet('dev', 'staging', 'production')]
    [string] $Environment = 'staging',

    [string] $ApiBaseUrl = "",
    [switch] $SkipProbe
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host 'TB-2141 - HotPathCache Redis L2 enablement checklist (staging/production beyond DEV TB-2120)'
Write-Host 'Guide: docs/library/SCALE_TIER_CACHE_GUIDE.md (TB-2141 section)'
Write-Host ("Target environment: {0}" -f $Environment)
Write-Host ""

$items = @(
    'terraform-redis applied for the target environment (staging.tfvars / production.tfvars)',
    'Connection string stored in Key Vault (prod-like) or ready as sensitive tf var',
    'terraform-container-apps hot_path_cache_redis_connection_string is non-empty',
    'api_min_replicas >= 2 and api_max_replicas sized (TB-947 TPM checklist)',
    'API + Worker revisions show HotPathCache__RedisConnectionString secret env',
    'API + Worker show HotPathCache__ExpectedApiReplicaCount == api_max_replicas',
    'Ready probe green after revision swap',
    'Warm list/dashboard reads across 2+ replicas; confirm cache hit / SQL drop',
    'Rollback plan known: clear redis tf var or Provider=Memory + ExpectedApiReplicaCount=1 with single replica'
)

$index = 1
foreach ($item in $items) {
    Write-Host ('  [{0}] {1}' -f $index, $item)
    $index++
}

if (($ApiBaseUrl.Trim().Length -gt 0) -and (-not $SkipProbe)) {
    $healthUrl = ($ApiBaseUrl.TrimEnd('/') + '/health/ready')
    Write-Host ""
    Write-Host ('Probing {0} ...' -f $healthUrl)
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 20 -UseBasicParsing
        Write-Host ('  HTTP {0}' -f [int]$response.StatusCode)
    }
    catch {
        Write-Host ('  Probe failed: {0}' -f $_.Exception.Message)
        exit 1
    }
}

Write-Host ""
Write-Host 'Remaining owner step: terraform apply with Redis connection string (requires Azure CLI/credentials).'
exit 0
