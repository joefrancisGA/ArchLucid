#Requires -Version 7.0
<#
.SYNOPSIS
  Generates a SAML SP certificate rotation checklist (Improvement #13).

.DESCRIPTION
  Reads ArchLucidAuth:Saml2 settings from appsettings (or -ConfigPath), inspects the signing
  certificate file when present, and writes SAML_ROTATION_PLAN.md.
#>
[CmdletBinding()]
param(
    [string] $ConfigPath = "",
    [string] $OutputPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $ConfigPath = Join-Path $repoRoot "ArchLucid.Api\appsettings.Development.json"
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $repoRoot "SAML_ROTATION_PLAN.md"
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Write-Error "Config file not found: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$saml = $config.ArchLucidAuth.Saml2

$enabled = [bool]($saml.Enabled)
$issuer = [string]($saml.Issuer)
$idpMetadata = [string]($saml.IdPMetadata)
$certFile = [string]($saml.SigningCertificateFile)

$expiryLine = "Certificate path not configured or file missing."
$daysRemaining = $null

if (-not [string]::IsNullOrWhiteSpace($certFile)) {
    $resolved = if ([System.IO.Path]::IsPathRooted($certFile)) { $certFile } else { Join-Path $repoRoot $certFile }

    if (Test-Path -LiteralPath $resolved) {
        $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($resolved)
        $notAfter = $cert.NotAfter.ToUniversalTime()
        $daysRemaining = [int]([Math]::Floor(($notAfter - [DateTime]::UtcNow).TotalDays))
        $expiryLine = "Signing certificate expires **$($notAfter.ToString('yyyy-MM-dd'))** UTC (~$daysRemaining days remaining)."
        $cert.Dispose()
    }
    else {
        $expiryLine = "Signing certificate file not found at ``$resolved``."
    }
}

$urgency = if ($null -ne $daysRemaining -and $daysRemaining -lt 30) { "URGENT" } else { "ROUTINE" }

$markdown = @"
# SAML SP rotation plan

- **Generated:** $([DateTime]::UtcNow.ToString("yyyy-MM-dd HH:mm:ss")) UTC
- **Priority:** $urgency
- **SAML SP enabled:** $enabled
- **SP issuer:** $issuer
- **IdP metadata URL:** $idpMetadata
- **$expiryLine**

## Checklist

1. Generate or obtain a new signing certificate (same key length or stronger than current).
2. Publish updated SP metadata to the IdP administrator.
3. Coordinate IdP metadata refresh if the IdP certificate or endpoints change.
4. Deploy the new certificate to ``ArchLucidAuth:Saml2:SigningCertificateFile`` (or Key Vault secret reference).
5. Restart API instances and verify ``POST /auth/saml/acs`` login in a non-production environment.
6. Schedule production cutover during a maintenance window; keep the prior certificate available for rollback for 24 hours.
7. Archive this plan with the rotation ticket and record the new certificate thumbprint in your CMDB.

## Verification

- Run ``GET /v1/admin/identity/diagnostics`` (or equivalent operator diagnostics) after deployment.
- Confirm no SAML assertion signature failures in audit logs for 48 hours post-cutover.
"@

Set-Content -LiteralPath $OutputPath -Value $markdown -Encoding utf8NoBOM
Write-Host "Wrote $OutputPath"
