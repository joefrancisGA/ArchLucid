# Shared helpers for customer-owned scheduled Azure extractor agents
# (Azure Automation runbook, Azure Function timer, or equivalent).
Set-StrictMode -Version Latest

function Import-ArchLucidScheduledExtractorAuthHeaders
{
    [string[]]$candidates = @(
        (Join-Path $PSScriptRoot "ArchLucid.AuthHeaders.ps1"),
        (Join-Path (Split-Path -Parent $PSScriptRoot) "ArchLucid.AuthHeaders.ps1")
    )

    foreach ($candidate in $candidates)
    {
        if (Test-Path -LiteralPath $candidate)
        {
            . $candidate

            return
        }
    }

    throw "Missing ArchLucid.AuthHeaders.ps1 next to the scheduled extractor scripts or in scripts/."
}

function Convert-ArchLucidScheduledExtractorAccessTokenToPlaintext
{
    param(
        $Token
    )

    if ($null -eq $Token)
    {
        return ""
    }

    # Az.Accounts 5+ returns SecureString; older modules returned a raw string.
    if ($Token -is [securestring])
    {
        [System.IntPtr]$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)

        try
        {
            return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
        }
        finally
        {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }

    return "$Token".Trim()
}

function Resolve-ArchLucidScheduledExtractorApiBaseUri
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $ApiBaseUrl
    )

    [string]$trimmed = "$ApiBaseUrl".Trim().TrimEnd("/")

    if ([string]::IsNullOrWhiteSpace($trimmed))
    {
        throw "ArchLucid API base URL is required."
    }

    return $trimmed
}

function Get-ArchLucidScheduledExtractorUploadUri
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $ApiBaseUrl,

        [string] $RunId = ""
    )

    [string]$base = Resolve-ArchLucidScheduledExtractorApiBaseUri -ApiBaseUrl $ApiBaseUrl
    [string]$uri = "$base/v1/azure-extractor/upload"
    [string]$trimmedRunId = "$RunId".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedRunId))
    {
        $uri = $uri + "?runId=" + [uri]::EscapeDataString($trimmedRunId)
    }

    return $uri
}

function Assert-ArchLucidScheduledExtractorPackagePath
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $PackagePath
    )

    [string]$trimmed = "$PackagePath".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmed))
    {
        throw "PackagePath is required."
    }

    if (-not (Test-Path -LiteralPath $trimmed))
    {
        throw "Extractor package '$trimmed' was not found."
    }

    return (Resolve-Path -LiteralPath $trimmed).Path
}

function New-ArchLucidScheduledExtractorUploadHeaders
{
    param(
        [string] $ApiKey = "",
        [string] $BearerToken = "",
        [string] $TenantId = "",
        [string] $WorkspaceId = "",
        [string] $ProjectId = ""
    )

    Import-ArchLucidScheduledExtractorAuthHeaders

    [hashtable]$authHeaders = Get-ArchLucidHttpAuthHeadersHashtable `
        -BearerToken $BearerToken `
        -ApiKey $ApiKey

    if ($authHeaders.Count -eq 0)
    {
        throw "Provide an ArchLucid API key or bearer token (Key Vault, env ARCHLUCID_API_KEY, or ARCHLUCID_BEARER_TOKEN)."
    }

    return Merge-ArchLucidHttpScopeHeaders `
        -Headers $authHeaders `
        -TenantId $TenantId `
        -WorkspaceId $WorkspaceId `
        -ProjectId $ProjectId
}

function Get-ArchLucidScheduledExtractorKeyVaultSecretValue
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $VaultName,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $SecretName
    )

    [string]$trimmedVault = "$VaultName".Trim()
    [string]$trimmedSecret = "$SecretName".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmedVault))
    {
        throw "VaultName is required."
    }

    if ([string]::IsNullOrWhiteSpace($trimmedSecret))
    {
        throw "SecretName is required."
    }

    [object]$accessToken = Get-AzAccessToken -ResourceUrl "https://vault.azure.net" -ErrorAction Stop

    if ($null -eq $accessToken)
    {
        throw "Key Vault access token was empty."
    }

    [string]$tokenText = Convert-ArchLucidScheduledExtractorAccessTokenToPlaintext -Token $accessToken.Token

    if ([string]::IsNullOrWhiteSpace($tokenText))
    {
        throw "Key Vault access token was empty."
    }

    [string]$uri = "https://$trimmedVault.vault.azure.net/secrets/$trimmedSecret" + "?api-version=7.4"
    [hashtable]$headers = @{
        Authorization = "Bearer $tokenText"
    }

    [object]$response = Invoke-RestMethod -Method GET -Uri $uri -Headers $headers -ErrorAction Stop

    if ($null -eq $response -or [string]::IsNullOrWhiteSpace("$($response.value)"))
    {
        throw "Key Vault secret '$trimmedSecret' was empty."
    }

    return "$($response.value)".Trim()
}

function Connect-ArchLucidScheduledExtractorManagedIdentity
{
    param(
        [string] $ClientId = "",
        [string] $TenantId = ""
    )

    [object]$existing = Get-AzContext -ErrorAction SilentlyContinue

    if ($null -ne $existing -and $null -ne $existing.Account)
    {
        return
    }

    [hashtable]$connectParams = @{
        Identity    = $true
        ErrorAction = "Stop"
    }

    [string]$trimmedClientId = "$ClientId".Trim()
    [string]$trimmedTenantId = "$TenantId".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedClientId))
    {
        $connectParams["AccountId"] = $trimmedClientId
    }

    if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId))
    {
        $connectParams["Tenant"] = $trimmedTenantId
    }

    $null = Connect-AzAccount @connectParams
}

function Resolve-ArchLucidScheduledExtractorApiKey
{
    param(
        [string] $ApiKey = "",
        [string] $KeyVaultName = "",
        [string] $KeyVaultSecretName = ""
    )

    [string]$trimmedKey = "$ApiKey".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedKey))
    {
        return $trimmedKey
    }

    if ($null -ne $env:ARCHLUCID_API_KEY -and -not [string]::IsNullOrWhiteSpace([string]$env:ARCHLUCID_API_KEY))
    {
        return $env:ARCHLUCID_API_KEY.Trim()
    }

    [string]$trimmedVault = "$KeyVaultName".Trim()
    [string]$trimmedSecret = "$KeyVaultSecretName".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedVault) -and -not [string]::IsNullOrWhiteSpace($trimmedSecret))
    {
        return Get-ArchLucidScheduledExtractorKeyVaultSecretValue `
            -VaultName $trimmedVault `
            -SecretName $trimmedSecret
    }

    return ""
}

function Send-ArchLucidAzureExtractorPackageFromPath
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $PackagePath,

        [Parameter(Mandatory = $true)]
        [string] $ApiBaseUrl,

        [string] $ApiKey = "",
        [string] $BearerToken = "",
        [string] $TenantId = "",
        [string] $WorkspaceId = "",
        [string] $ProjectId = "",
        [string] $RunId = ""
    )

    [string]$resolvedPackage = Assert-ArchLucidScheduledExtractorPackagePath -PackagePath $PackagePath
    [string]$uri = Get-ArchLucidScheduledExtractorUploadUri -ApiBaseUrl $ApiBaseUrl -RunId $RunId
    [hashtable]$headers = New-ArchLucidScheduledExtractorUploadHeaders `
        -ApiKey $ApiKey `
        -BearerToken $BearerToken `
        -TenantId $TenantId `
        -WorkspaceId $WorkspaceId `
        -ProjectId $ProjectId

    [object]$item = Get-Item -LiteralPath $resolvedPackage

    [hashtable]$webParams = @{
        Method             = "POST"
        Uri                = $uri
        Headers            = $headers
        Form               = @{ file = $item }
        SkipHttpErrorCheck = $true
        ErrorAction        = "Stop"
    }

    [object]$response = Invoke-WebRequest @webParams

    if ($null -eq $response)
    {
        throw "ArchLucid upload returned no response."
    }

    [int]$status = [int]$response.StatusCode

    if ($status -lt 200 -or $status -ge 300)
    {
        [string]$body = "$($response.Content)"

        if ($body.Length -gt 2000)
        {
            $body = $body.Substring(0, 2000)
        }

        throw "ArchLucid upload failed with HTTP $status. $body"
    }

    return $response
}

function Get-ArchLucidScheduledExtractorCollectorScriptPath
{
    param(
        [string] $CollectorScriptPath = ""
    )

    [string]$trimmed = "$CollectorScriptPath".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmed))
    {
        if (-not (Test-Path -LiteralPath $trimmed))
        {
            throw "Collector script '$trimmed' was not found."
        }

        return (Resolve-Path -LiteralPath $trimmed).Path
    }

    [string]$defaultPath = Join-Path $PSScriptRoot "Get-ArchLucidAzurePackage.ps1"

    if (-not (Test-Path -LiteralPath $defaultPath))
    {
        throw "Missing Get-ArchLucidAzurePackage.ps1 next to the scheduled extractor scripts."
    }

    return (Resolve-Path -LiteralPath $defaultPath).Path
}

function Invoke-ArchLucidScheduledAzureExtractorCollection
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $CollectorScriptPath,

        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [Parameter(Mandatory = $true)]
        [string] $OutputPath,

        [string] $TenantId = "",
        [switch] $IncludeCost,
        [switch] $IncludeRetailPrices,
        [switch] $DryRun
    )

    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        throw "SubscriptionId is required."
    }

    [hashtable]$collectorParams = @{
        SubscriptionId = $trimmedSubscriptionId
        OutputPath     = $OutputPath
    }

    [string]$trimmedTenantId = "$TenantId".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId))
    {
        $collectorParams["TenantId"] = $trimmedTenantId
    }

    if ($IncludeCost)
    {
        $collectorParams["IncludeCost"] = $true
    }

    if ($IncludeRetailPrices)
    {
        $collectorParams["IncludeRetailPrices"] = $true
    }

    if ($DryRun)
    {
        $collectorParams["DryRun"] = $true
    }

    & $CollectorScriptPath @collectorParams

    if (-not $?)
    {
        throw "Get-ArchLucidAzurePackage.ps1 failed."
    }
}
