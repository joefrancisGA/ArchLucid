#Requires -Version 5.1
<#
.SYNOPSIS
  Scripts the TB-2016 marketing / operator dual Container App cutover (no Front Door).

.DESCRIPTION
  Prepares or applies (with -Apply) the ops steps that cannot ship in the UI image alone:

  1. DnsGuide       — print TXT/CNAME records from live CAE / app FQDNs (you create DNS)
  2. SetUiEnv       — ARCHLUCID_* site + API URLs on operator + marketing UI apps
  3. SetApiCors     — Cors__AllowedOrigins__* for marketing + app hosts on the API app
  4. BindHostnames  — az containerapp hostname bind (managed cert) after DNS propagates
  5. SetGithubSecret— CONTAINER_APP_MARKETING_UI_NAME on a GitHub Environment
  6. Verify         — read-back env, hostnames, and CORS without mutating

  Default is dry-run (prints planned az/gh commands). Pass -Apply to execute mutations.
  Safe to run before the image that contains host-gate middleware is deployed: env/CORS/DNS
  can land first; BindHostnames should wait until DNS TXT/CNAME resolve.

.PARAMETER ResourceGroup
  Azure resource group hosting the Container Apps.

.PARAMETER EnvironmentName
  Container Apps managed environment name (for hostname bind).

.PARAMETER ApiAppName
  API Container App name.

.PARAMETER OperatorUiAppName
  Operator UI Container App (app.<domain>).

.PARAMETER MarketingUiAppName
  Marketing UI Container App (apex / www).

.PARAMETER PublicSiteUrl
  Marketing origin, e.g. https://archlucid.net (no trailing slash).

.PARAMETER AppSiteUrl
  Operator origin, e.g. https://app.archlucid.net (no trailing slash).

.PARAMETER ApiBaseUrl
  Absolute API base for UI server proxy/RSC (https://… no trailing slash).

.PARAMETER MarketingHostname
  Hostname to bind on the marketing app (default: host of PublicSiteUrl). Also bind WwwHostname if set.

.PARAMETER WwwHostname
  Optional second marketing hostname (e.g. www.archlucid.net).

.PARAMETER OperatorHostname
  Hostname to bind on the operator UI (default: host of AppSiteUrl).

.PARAMETER ApiHostname
  Optional API custom hostname to bind.

.PARAMETER GithubEnvironment
  GitHub Environment for CONTAINER_APP_MARKETING_UI_NAME (default staging).

.PARAMETER Phase
  Which steps to run. Default All (DnsGuide through Verify, BindHostnames only if -BindHostnamesNow).

.PARAMETER BindHostnamesNow
  Include BindHostnames in -Phase All. Omit until DNS has propagated.

.PARAMETER Apply
  Execute mutations. Without -Apply, only prints the plan / commands.

.EXAMPLE
  # Dry-run full plan (no Azure changes)
  .\scripts\ops\Invoke-MarketingOperatorHostCutover.ps1 `
    -ResourceGroup 'rg-ArchLucid-staging' `
    -EnvironmentName 'cae-archlucid-staging' `
    -PublicSiteUrl 'https://archlucid.net' `
    -AppSiteUrl 'https://app.archlucid.net' `
    -ApiBaseUrl 'https://api.archlucid.net' `
    -WwwHostname 'www.archlucid.net'

.EXAMPLE
  # After DNS propagates — bind certs + set env/CORS/GitHub
  .\scripts\ops\Invoke-MarketingOperatorHostCutover.ps1 `
    -ResourceGroup 'rg-ArchLucid-staging' `
    -EnvironmentName 'cae-archlucid-staging' `
    -PublicSiteUrl 'https://archlucid.net' `
    -AppSiteUrl 'https://app.archlucid.net' `
    -ApiBaseUrl 'https://api.archlucid.net' `
    -WwwHostname 'www.archlucid.net' `
    -BindHostnamesNow `
    -Apply
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $ResourceGroup,

    [Parameter(Mandatory = $true)]
    [string] $EnvironmentName,

    [string] $ApiAppName = 'archlucid-api',
    [string] $OperatorUiAppName = 'archlucid-ui',
    [string] $MarketingUiAppName = 'archlucid-ui-marketing',

    [Parameter(Mandatory = $true)]
    [string] $PublicSiteUrl,

    [Parameter(Mandatory = $true)]
    [string] $AppSiteUrl,

    [Parameter(Mandatory = $true)]
    [string] $ApiBaseUrl,

    [string] $MarketingHostname = '',
    [string] $WwwHostname = '',
    [string] $OperatorHostname = '',
    [string] $ApiHostname = '',

    [string] $GithubEnvironment = 'staging',
    [string] $GithubRepo = '',

    [ValidateSet('All', 'DnsGuide', 'SetUiEnv', 'SetApiCors', 'BindHostnames', 'SetGithubSecret', 'Verify')]
    [string[]] $Phase = @('All'),

    [switch] $BindHostnamesNow,
    [switch] $Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-NormalizedOrigin {
    param([string] $Raw)

    $trimmed = $Raw.Trim().TrimEnd('/')

    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        throw 'Origin URL must be non-empty.'
    }

    $uri = [Uri] $trimmed

    if ($uri.Scheme -notin @('http', 'https')) {
        throw "Origin must be http(s): $Raw"
    }

    return "$($uri.Scheme)://$($uri.Authority)"
}

function Get-HostFromOrigin {
    param([string] $Origin)

    return ([Uri] $Origin).Host.ToLowerInvariant()
}

function Test-AzCli {
    $null = Get-Command az -ErrorAction Stop
}

function Invoke-AzOrEcho {
    param(
        [string] $Description,
        [string[]] $AzArgs
    )

    $display = 'az ' + ($AzArgs -join ' ')
    Write-Host ""
    Write-Host "=== $Description ===" -ForegroundColor Cyan
    Write-Host $display

    if (-not $Apply) {
        Write-Host '(dry-run - pass -Apply to execute)' -ForegroundColor Yellow
        return
    }

    & az @AzArgs
    if ($LASTEXITCODE -ne 0) {
        throw "az failed ($LASTEXITCODE): $Description"
    }
}

function Get-ContainerAppFqdn {
    param([string] $AppName)

    $fqdn = az containerapp show -g $ResourceGroup -n $AppName --query 'properties.configuration.ingress.fqdn' -o tsv 2>$null

    if ([string]::IsNullOrWhiteSpace($fqdn)) {
        $fqdn = az containerapp show -g $ResourceGroup -n $AppName --query 'properties.latestRevisionFqdn' -o tsv 2>$null
    }

    return $fqdn
}

function Get-CaeVerificationId {
    $id = az containerapp env show -g $ResourceGroup -n $EnvironmentName --query 'properties.customDomainConfiguration.customDomainVerificationId' -o tsv 2>$null

    if ([string]::IsNullOrWhiteSpace($id)) {
        # Older shape / alternate property path
        $id = az containerapp env show -g $ResourceGroup -n $EnvironmentName --query 'properties.customDomainVerificationId' -o tsv 2>$null
    }

    return $id
}

function Get-EnvValueMap {
    param([string] $AppName)

    $json = az containerapp show -g $ResourceGroup -n $AppName --query 'properties.template.containers[0].env' -o json 2>$null

    if ([string]::IsNullOrWhiteSpace($json)) {
        return @{}
    }

    $map = @{}

    foreach ($item in ($json | ConvertFrom-Json)) {
        if ($null -eq $item.name) {
            continue
        }

        $map[$item.name] = if ($null -ne $item.value) { [string] $item.value } elseif ($null -ne $item.secretRef) { '(secret-ref)' } else { '' }
    }

    return $map
}

$publicOrigin = Get-NormalizedOrigin -Raw $PublicSiteUrl
$appOrigin = Get-NormalizedOrigin -Raw $AppSiteUrl
$apiOrigin = Get-NormalizedOrigin -Raw $ApiBaseUrl

if ([string]::IsNullOrWhiteSpace($MarketingHostname)) {
    $MarketingHostname = Get-HostFromOrigin -Origin $publicOrigin
}

if ([string]::IsNullOrWhiteSpace($OperatorHostname)) {
    $OperatorHostname = Get-HostFromOrigin -Origin $appOrigin
}

$phases = [System.Collections.Generic.List[string]]::new()

foreach ($p in $Phase) {
    if ($p -eq 'All') {
        [void] $phases.Add('DnsGuide')
        [void] $phases.Add('SetUiEnv')
        [void] $phases.Add('SetApiCors')
        [void] $phases.Add('SetGithubSecret')
        [void] $phases.Add('Verify')

        if ($BindHostnamesNow) {
            [void] $phases.Add('BindHostnames')
        }

        continue
    }

    if (-not $phases.Contains($p)) {
        [void] $phases.Add($p)
    }
}

Write-Host 'Marketing / operator host cutover (TB-2016)' -ForegroundColor Green
Write-Host "Mode: $(if ($Apply) { 'APPLY' } else { 'DRY-RUN' })"
Write-Host "Resource group: $ResourceGroup"
Write-Host "CAE:            $EnvironmentName"
Write-Host "Public site:    $publicOrigin  (host $MarketingHostname$(if ($WwwHostname) { ", $WwwHostname" }))"
Write-Host "App site:       $appOrigin  (host $OperatorHostname)"
Write-Host "API base:       $apiOrigin"
Write-Host "Phases:         $($phases -join ', ')"

Test-AzCli

if ($phases -contains 'DnsGuide') {
    Write-Host ''
    Write-Host '=== DnsGuide ===' -ForegroundColor Cyan

    $verificationId = Get-CaeVerificationId
    $marketingFqdn = Get-ContainerAppFqdn -AppName $MarketingUiAppName
    $operatorFqdn = Get-ContainerAppFqdn -AppName $OperatorUiAppName
    $apiFqdn = Get-ContainerAppFqdn -AppName $ApiAppName

    Write-Host "CAE verification id: $(if ($verificationId) { $verificationId } else { '(unavailable - check az login / names)' })"
    Write-Host "Marketing app FQDN:  $(if ($marketingFqdn) { $marketingFqdn } else { '(app missing - terraform apply first)' })"
    Write-Host "Operator app FQDN:   $(if ($operatorFqdn) { $operatorFqdn } else { '(missing)' })"
    Write-Host "API app FQDN:        $(if ($apiFqdn) { $apiFqdn } else { '(missing)' })"
    Write-Host ''
    Write-Host 'Create these DNS records at your registrar (not automated here):'
    Write-Host '  Apex tip: many registrars forbid CNAME at zone apex - use ALIAS/ANAME/flattened CNAME,'
    Write-Host '  or put marketing on www and 301 apex->www at the DNS/hosting layer.'
    Write-Host ''

    if ($verificationId) {
        Write-Host "  TXT   asuid.$MarketingHostname   →  $verificationId"

        if (-not [string]::IsNullOrWhiteSpace($WwwHostname)) {
            Write-Host "  TXT   asuid.$WwwHostname         →  $verificationId"
        }

        Write-Host "  TXT   asuid.$OperatorHostname    →  $verificationId"

        if (-not [string]::IsNullOrWhiteSpace($ApiHostname)) {
            Write-Host "  TXT   asuid.$ApiHostname         →  $verificationId"
        }
    }

    if ($marketingFqdn) {
        Write-Host "  CNAME/ALIAS $MarketingHostname   →  $marketingFqdn"

        if (-not [string]::IsNullOrWhiteSpace($WwwHostname)) {
            Write-Host "  CNAME $WwwHostname               →  $marketingFqdn"
        }
    }

    if ($operatorFqdn) {
        Write-Host "  CNAME $OperatorHostname          →  $operatorFqdn"
    }

    if ($apiFqdn -and -not [string]::IsNullOrWhiteSpace($ApiHostname)) {
        Write-Host "  CNAME $ApiHostname               →  $apiFqdn"
    }

    Write-Host ''
    Write-Host 'After DNS propagates, re-run with -BindHostnamesNow -Apply (or -Phase BindHostnames -Apply).'
}

if ($phases -contains 'SetUiEnv') {
    $operatorEnv = @(
        'containerapp', 'update',
        '-g', $ResourceGroup,
        '-n', $OperatorUiAppName,
        '--set-env-vars',
        "ARCHLUCID_UI_ROLE=operator",
        "ARCHLUCID_PUBLIC_SITE_URL=$publicOrigin",
        "ARCHLUCID_APP_SITE_URL=$appOrigin",
        "ARCHLUCID_API_BASE_URL=$apiOrigin",
        "NEXT_PUBLIC_ARCHLUCID_SITE_URL=$publicOrigin",
        "NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL=$appOrigin",
        '--output', 'none'
    )
    Invoke-AzOrEcho -Description "Set site/API env on operator UI ($OperatorUiAppName)" -AzArgs $operatorEnv

    $marketingEnv = @(
        'containerapp', 'update',
        '-g', $ResourceGroup,
        '-n', $MarketingUiAppName,
        '--set-env-vars',
        "ARCHLUCID_UI_ROLE=marketing",
        "ARCHLUCID_PUBLIC_SITE_URL=$publicOrigin",
        "ARCHLUCID_APP_SITE_URL=$appOrigin",
        "ARCHLUCID_API_BASE_URL=$apiOrigin",
        "NEXT_PUBLIC_ARCHLUCID_SITE_URL=$publicOrigin",
        "NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL=$appOrigin",
        '--output', 'none'
    )
    Invoke-AzOrEcho -Description "Set site/API env on marketing UI ($MarketingUiAppName)" -AzArgs $marketingEnv
}

if ($phases -contains 'SetApiCors') {
    $origins = [System.Collections.Generic.List[string]]::new()
    [void] $origins.Add($publicOrigin)

    if (-not [string]::IsNullOrWhiteSpace($WwwHostname)) {
        $wwwOrigin = "https://$($WwwHostname.Trim().ToLowerInvariant())"

        if (-not $origins.Contains($wwwOrigin)) {
            [void] $origins.Add($wwwOrigin)
        }
    }

    if (-not $origins.Contains($appOrigin)) {
        [void] $origins.Add($appOrigin)
    }

    $corsArgs = [System.Collections.Generic.List[string]]::new()
    [void] $corsArgs.AddRange(@(
            'containerapp', 'update',
            '-g', $ResourceGroup,
            '-n', $ApiAppName,
            '--set-env-vars'
        ))

    for ($i = 0; $i -lt $origins.Count; $i++) {
        [void] $corsArgs.Add("Cors__AllowedOrigins__$i=$($origins[$i])")
    }

    [void] $corsArgs.AddRange(@('--output', 'none'))

    Write-Host ''
    Write-Host "CORS origins to set: $($origins -join ', ')" -ForegroundColor DarkGray
    Invoke-AzOrEcho -Description "Set API CORS ($ApiAppName)" -AzArgs $corsArgs.ToArray()
}

if ($phases -contains 'BindHostnames') {
    $binds = @(
        @{ App = $MarketingUiAppName; Host = $MarketingHostname }
        @{ App = $OperatorUiAppName; Host = $OperatorHostname }
    )

    if (-not [string]::IsNullOrWhiteSpace($WwwHostname)) {
        $binds += @{ App = $MarketingUiAppName; Host = $WwwHostname }
    }

    if (-not [string]::IsNullOrWhiteSpace($ApiHostname)) {
        $binds += @{ App = $ApiAppName; Host = $ApiHostname }
    }

    foreach ($bind in $binds) {
        Invoke-AzOrEcho -Description "Bind hostname $($bind.Host) → $($bind.App)" -AzArgs @(
            'containerapp', 'hostname', 'bind',
            '--hostname', $bind.Host,
            '-g', $ResourceGroup,
            '-n', $bind.App,
            '--environment', $EnvironmentName,
            '--validation-method', 'CNAME'
        )
    }
}

if ($phases -contains 'SetGithubSecret') {
    Write-Host ''
    Write-Host '=== SetGithubSecret ===' -ForegroundColor Cyan

    if ([string]::IsNullOrWhiteSpace($GithubRepo)) {
        Write-Host ('echo {0} | gh secret set CONTAINER_APP_MARKETING_UI_NAME --env {1}' -f $MarketingUiAppName, $GithubEnvironment)
    }
    else {
        Write-Host ('echo {0} | gh secret set CONTAINER_APP_MARKETING_UI_NAME --env {1} --repo {2}' -f $MarketingUiAppName, $GithubEnvironment, $GithubRepo)
    }

    if (-not $Apply) {
        Write-Host '(dry-run - pass -Apply to execute)' -ForegroundColor Yellow
    }
    else {
        $null = Get-Command gh -ErrorAction Stop

        if ([string]::IsNullOrWhiteSpace($GithubRepo)) {
            $MarketingUiAppName | gh secret set CONTAINER_APP_MARKETING_UI_NAME --env $GithubEnvironment
        }
        else {
            $MarketingUiAppName | gh secret set CONTAINER_APP_MARKETING_UI_NAME --env $GithubEnvironment --repo $GithubRepo
        }

        if ($LASTEXITCODE -ne 0) {
            throw "gh secret set CONTAINER_APP_MARKETING_UI_NAME failed ($LASTEXITCODE)"
        }

        Write-Host "Set CONTAINER_APP_MARKETING_UI_NAME on environment $GithubEnvironment"
    }
}

if ($phases -contains 'Verify') {
    Write-Host ''
    Write-Host '=== Verify (read-only) ===' -ForegroundColor Cyan

    foreach ($app in @($OperatorUiAppName, $MarketingUiAppName, $ApiAppName)) {
        Write-Host "--- $app ---"
        $exists = az containerapp show -g $ResourceGroup -n $app --query name -o tsv 2>$null

        if ([string]::IsNullOrWhiteSpace($exists)) {
            Write-Host '  MISSING - terraform apply / create app first' -ForegroundColor Red
            continue
        }

        $map = Get-EnvValueMap -AppName $app

        if ($app -eq $ApiAppName) {
            for ($i = 0; $i -le 3; $i++) {
                $key = "Cors__AllowedOrigins__$i"

                if ($map.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace($map[$key])) {
                    Write-Host "  $key = $($map[$key])"
                }
            }
        }
        else {
            foreach ($key in @(
                    'ARCHLUCID_UI_ROLE',
                    'ARCHLUCID_PUBLIC_SITE_URL',
                    'ARCHLUCID_APP_SITE_URL',
                    'ARCHLUCID_API_BASE_URL'
                )) {
                $val = if ($map.ContainsKey($key)) { $map[$key] } else { '(unset)' }
                Write-Host "  $key = $val"
            }
        }

        $custom = az containerapp hostname list -g $ResourceGroup -n $app -o tsv 2>$null
        Write-Host "  hostnames: $(if ($custom) { ($custom -join ', ') } else { '(none listed / CLI unsupported)' })"
    }

    Write-Host ''
    Write-Host 'Manual smoke after image deploy + DNS:'
    Write-Host "  curl -sI $publicOrigin/welcome"
    Write-Host "  curl -sI $publicOrigin/reviews   # expect 307 → $appOrigin/reviews"
    Write-Host "  curl -sI $appOrigin/             # operator home"
    Write-Host "  curl -sI $appOrigin/welcome      # expect 307 → $publicOrigin/welcome"
}

Write-Host ''
Write-Host "Cutover script finished ($(if ($Apply) { 'applied' } else { 'dry-run' })). See docs/runbooks/MARKETING_OPERATOR_HOST_CUTOVER.md" -ForegroundColor Green
