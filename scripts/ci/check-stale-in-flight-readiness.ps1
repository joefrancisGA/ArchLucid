# Pre-deploy / CD helper: fail when stale in-flight runs would block strict readiness.
param(
    [string]$ReadyUrl = 'http://127.0.0.1:5128/health/ready',
    [switch]$AllowStaleInFlight
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

try {
    $response = Invoke-WebRequest -Uri $ReadyUrl -UseBasicParsing -TimeoutSec 15
    $body = $response.Content | ConvertFrom-Json
}
catch {
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd() | ConvertFrom-Json
    }
    else {
        throw
    }
}

$dataConsistency = $body.entries | Where-Object { $_.name -eq 'data_consistency' } | Select-Object -First 1

if ($null -eq $dataConsistency) {
    Write-Host 'PASS: data_consistency check not registered on this host.'
    exit 0
}

if ($dataConsistency.status -eq 'Healthy') {
    Write-Host 'PASS: data_consistency is Healthy.'
    exit 0
}

if ($AllowStaleInFlight -and $body.status -eq 'Healthy') {
    Write-Host 'PASS: readiness Healthy with StaleInFlightRunsBlockReadiness=false.'
    exit 0
}

Write-Error "HOLD: data_consistency is $($dataConsistency.status). Run scripts/ops/remediate-stale-in-flight-localdb.ps1 or POST /v1/admin/diagnostics/data-consistency/stale-in-flight-runs."
exit 1
