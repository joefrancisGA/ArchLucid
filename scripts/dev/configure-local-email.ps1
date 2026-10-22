#Requires -Version 5.1
<#
.SYNOPSIS
  Configure ArchLucid.Api user secrets for outbound email (invites, OTP, trial mail).

.DESCRIPTION
  Overrides appsettings.Development.json Email:* via dotnet user secrets (not committed).

.EXAMPLE
  # Azure Communication Services Email (recommended — matches production):
  .\scripts\dev\configure-local-email.ps1 -UseAcs `
    -AcsEndpoint 'https://your-acs-resource.communication.azure.com/' `
    -FromAddress 'DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net'

.EXAMPLE
  # Local capture only (smtp4dev from docker-compose.local.yml):
  .\scripts\dev\configure-local-email.ps1 -UseLocalSmtp4Dev

.EXAMPLE
  # SMTP relay (Gmail, SendGrid, etc.):
  .\scripts\dev\configure-local-email.ps1 `
    -SmtpHost smtp.gmail.com `
    -SmtpPort 587 `
    -SmtpUser 'you@gmail.com' `
    -SmtpPassword 'your-app-password' `
    -FromAddress 'you@gmail.com'
#>
[CmdletBinding(DefaultParameterSetName = 'Smtp')]
param(
    [Parameter(ParameterSetName = 'Acs')]
    [switch] $UseAcs,

    [Parameter(ParameterSetName = 'Smtp4Dev')]
    [switch] $UseLocalSmtp4Dev,

    [Parameter(ParameterSetName = 'Acs')]
    [string] $AcsEndpoint = '',

    [Parameter(ParameterSetName = 'Acs')]
    [string] $AzureManagedIdentityClientId = '',

    [Parameter(ParameterSetName = 'Smtp')]
    [string] $SmtpHost = 'smtp.gmail.com',

    [Parameter(ParameterSetName = 'Smtp')]
    [int] $SmtpPort = 587,

    [Parameter(ParameterSetName = 'Smtp')]
    [string] $SmtpUser = '',

    [Parameter(ParameterSetName = 'Smtp')]
    [string] $SmtpPassword = '',

    [string] $FromAddress = '',
    [string] $FromDisplayName = 'ArchLucid (local)',
    [string] $OperatorBaseUrl = 'http://localhost:3000',
    [string] $ProjectPath = 'ArchLucid.Api/ArchLucid.Api.csproj'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath $ProjectPath)) {
    throw "API project not found at $ProjectPath (cwd: $repoRoot)"
}

function Set-Secret([string] $Key, [string] $Value) {
    & dotnet user-secrets set $Key $Value --project $ProjectPath | Out-Null
}

function Normalize-AcsEndpoint([string] $Endpoint) {
    $trimmed = $Endpoint.Trim().TrimEnd('/')

    if (-not $trimmed.StartsWith('https://', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'AcsEndpoint must be an HTTPS URL (for example https://your-resource.communication.azure.com/).'
    }

    return $trimmed
}

if ($UseAcs) {
    if ([string]::IsNullOrWhiteSpace($AcsEndpoint)) {
        throw 'Provide -AcsEndpoint (Communication Services overview, Endpoint field).'
    }

    if ([string]::IsNullOrWhiteSpace($FromAddress)) {
        throw 'Provide -FromAddress (verified sender, e.g. DoNotReply@....azurecomm.net).'
    }

    $endpoint = Normalize-AcsEndpoint $AcsEndpoint

    Set-Secret 'Email:Provider' 'AzureCommunicationServices'
    Set-Secret 'Email:AzureCommunicationServicesEndpoint' $endpoint
    Set-Secret 'Email:FromAddress' $FromAddress.Trim()
    Set-Secret 'Email:FromDisplayName' $FromDisplayName.Trim()
    Set-Secret 'Email:OperatorBaseUrl' $OperatorBaseUrl.Trim().TrimEnd('/')

    if (-not [string]::IsNullOrWhiteSpace($AzureManagedIdentityClientId)) {
        Set-Secret 'Email:AzureManagedIdentityClientId' $AzureManagedIdentityClientId.Trim()
    }

    Write-Host ''
    Write-Host 'ACS email secrets configured for ArchLucid.Api.' -ForegroundColor Green
    Write-Host "  Provider:   AzureCommunicationServices"
    Write-Host "  Endpoint:   $endpoint"
    Write-Host "  From:       $($FromAddress.Trim())"
    Write-Host "  Operator UI: $OperatorBaseUrl"
    Write-Host ''
    Write-Host 'Next steps:'
    Write-Host '  1. az login  (DefaultAzureCredential must reach the Communication Services resource).'
    Write-Host '  2. Grant your user Contributor on the Communication Services resource if send fails with 403.'
    Write-Host '  3. Restart ArchLucid.Api.'
    Write-Host '  4. Revoke any stale pending invite, then send a new one (resend does not re-mail).'
    Write-Host '  5. Check recipient inbox and spam.'

    return
}

if ($UseLocalSmtp4Dev) {
    $SmtpHost = 'localhost'
    $SmtpPort = 2525
    $FromAddress = 'noreply@localhost.dev'
    $SmtpUser = ''
    $SmtpPassword = ''
}

if ([string]::IsNullOrWhiteSpace($FromAddress)) {
    if ([string]::IsNullOrWhiteSpace($SmtpUser)) {
        throw 'Provide -FromAddress or -SmtpUser (used as From when FromAddress is omitted).'
    }

    $FromAddress = $SmtpUser.Trim()
}

Set-Secret 'Email:Provider' 'Smtp'
Set-Secret 'Email:SmtpHost' $SmtpHost.Trim()
Set-Secret 'Email:SmtpPort' "$SmtpPort"
Set-Secret 'Email:FromAddress' $FromAddress.Trim()
Set-Secret 'Email:FromDisplayName' $FromDisplayName.Trim()
Set-Secret 'Email:OperatorBaseUrl' $OperatorBaseUrl.Trim().TrimEnd('/')

if (-not [string]::IsNullOrWhiteSpace($SmtpUser)) {
    Set-Secret 'Email:SmtpUser' $SmtpUser.Trim()
}

if (-not [string]::IsNullOrWhiteSpace($SmtpPassword)) {
    Set-Secret 'Email:SmtpPassword' $SmtpPassword
}

Write-Host ''
Write-Host 'SMTP email secrets configured for ArchLucid.Api.' -ForegroundColor Green
Write-Host "  Provider:      Smtp"
Write-Host "  SMTP:          ${SmtpHost}:${SmtpPort}"
Write-Host "  From:          $FromAddress"
Write-Host "  Operator UI:   $OperatorBaseUrl"
Write-Host ''
Write-Host 'Next steps:'
Write-Host '  1. Restart ArchLucid.Api (secrets load at startup).'
Write-Host '  2. Revoke any existing pending invite, then send a new one (resend does not re-mail).'

if ($UseLocalSmtp4Dev) {
    Write-Host '  3. Open http://localhost:8025 to read captured mail (smtp4dev).'
}
else {
    Write-Host '  3. Check the recipient inbox and spam folder.'
}
