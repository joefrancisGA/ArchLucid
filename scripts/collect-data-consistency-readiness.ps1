#requires -Version 5.1
<#
.SYNOPSIS
  Collect data-consistency readiness signals for release or pilot handoff (read-only).

.PARAMETER BaseUrl
  API root (defaults to ARCHLUCID_API_URL or http://localhost:5128).
#>
param(
    [string] $BaseUrl = '',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [string] $OutputDirectory = 'artifacts/data-consistency-readiness'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:5128'
}

$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outDir = Join-Path (Get-Location) $OutputDirectory
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "data-consistency-readiness-$timestamp.md"

function Invoke-ProbeText {
    param([string] $RelativePath)

    $uri = "$normalizedBase$RelativePath"
    $req = @{
        Uri             = $uri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 90
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    $response = Invoke-WebRequest @req
    return [string]$response.Content
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# Data consistency readiness summary')
$lines.Add('')
$lines.Add("| Field | Value |")
$lines.Add("| --- | --- |")
$lines.Add("| Generated UTC | $timestamp |")
$lines.Add("| Base URL | $normalizedBase |")
$lines.Add('')
$lines.Add('## Probes')
$lines.Add('')
$lines.Add('| Probe | Status | Notes |')
$lines.Add('| --- | --- | --- |')

try {
    $ready = Invoke-ProbeText '/health/ready'
    $lines.Add("| /health/ready | PASS | Response captured |")
}
catch {
    $lines.Add("| /health/ready | FAIL | $($_.Exception.Message) |")
}

try {
    $diag = Invoke-ProbeText '/health/diagnostics'
    $lines.Add("| /health/diagnostics | PASS | Includes SQL + subsystem checks when authorized |")
}
catch {
    $lines.Add("| /health/diagnostics | WARN | $($_.Exception.Message) — may require admin API key |")
}

$lines.Add('')
$lines.Add('## Interpretation')
$lines.Add('')
$lines.Add('- **Soft-archived runs** remain in `dbo.Runs` with `ArchivedUtc` set — not orphan rows.')
$lines.Add('- Orphan probes target missing parent run/manifest relationships — see `docs/library/DATA_CONSISTENCY_MATRIX.md`.')
$lines.Add('- Run dry-run remediation only via documented admin routes; this script does not mutate data.')
$lines.Add('')
$lines.Add('## Next steps when unhealthy')
$lines.Add('')
$lines.Add('1. Capture support bundle (`archlucid support-bundle`).')
$lines.Add('2. Review orphan counts in `/health/diagnostics` JSON.')
$lines.Add('3. Follow dry-run paths in [`DATA_CONSISTENCY_MATRIX.md`](../docs/library/DATA_CONSISTENCY_MATRIX.md).')

$lines | Set-Content -LiteralPath $outFile -Encoding UTF8
Write-Host "Wrote $outFile"
exit 0
