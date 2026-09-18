Set-StrictMode -Version Latest

function Ensure-ArchLucidAzModules
{
    param(
        [switch] $SkipModuleInstall
    )

    if ($env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT -eq "1")
    {
        return
    }

    [string[]]$requiredModules = @("Az.Accounts", "Az.Resources")

    if ($SkipModuleInstall)
    {
        foreach ($moduleName in $requiredModules)
        {
            if (-not (Get-Module -ListAvailable -Name $moduleName))
            {
                $message = 'Required module {0} is missing. Run Install-Module Az -Scope CurrentUser or omit -SkipModuleInstall.' -f $moduleName
                throw $message
            }
        }

        [System.Management.Automation.ActionPreference]$previousWarningPreference = $WarningPreference

        try
        {
            $WarningPreference = 'SilentlyContinue'
            Import-Module Az.Accounts, Az.Resources -ErrorAction Stop
        }
        finally
        {
            $WarningPreference = $previousWarningPreference
        }

        return
    }

    [string[]]$missingModules =
        @($requiredModules | Where-Object { -not (Get-Module -ListAvailable -Name $_) })

    if ($missingModules.Count -gt 0)
    {
        $installMessage = 'Installing Az PowerShell modules ({0} missing). First run only - review Install-Module per your change-management policy.' -f ($missingModules -join ", ")

        Write-Host $installMessage -ForegroundColor Cyan

        Install-Module Az -Scope CurrentUser -Force -AllowClobber -ErrorAction Stop
    }

    [System.Management.Automation.ActionPreference]$previousWarningPreference = $WarningPreference

    try
    {
        # Az.Accounts refreshes cached tokens for every signed-in tenant on import; ignore stale tenants.
        $WarningPreference = 'SilentlyContinue'
        Import-Module Az.Accounts, Az.Resources -ErrorAction Stop
    }
    finally
    {
        $WarningPreference = $previousWarningPreference
    }
}

function Get-ArchLucidAzureSubscriptionGuid
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $SubscriptionId
    )

    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()

    if ($trimmedSubscriptionId -match '/subscriptions/([^/]+)')
    {
        return $Matches[1]
    }

    return $trimmedSubscriptionId
}

function Test-ArchLucidAzureSubscriptionIdsMatch
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Left,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Right
    )

    [string]$leftGuid = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId $Left
    [string]$rightGuid = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId $Right

    if ([string]::IsNullOrWhiteSpace($leftGuid) -or [string]::IsNullOrWhiteSpace($rightGuid))
    {
        return $false
    }

    return $leftGuid -eq $rightGuid
}

function Clear-ArchLucidAzureAccountSessions
{
    param(
        [string[]] $ExceptTenantIds = @()
    )

    [object[]]$contexts = @(
        Get-AzContext -ListAvailable -ErrorAction SilentlyContinue |
            Where-Object { $null -ne $_ -and $null -ne $_.Account }
    )

    foreach ($context in $contexts)
    {
        [string]$contextTenantId = "$( $context.Tenant.Id )".Trim()

        if ($ExceptTenantIds.Count -gt 0)
        {
            [bool]$keepTenant =
                @($ExceptTenantIds | ForEach-Object { "$_".Trim() }) -contains $contextTenantId

            if ($keepTenant)
            {
                continue
            }
        }

        $null = Disconnect-AzAccount `
            -AccountId $context.Account.Id `
            -Confirm:$false `
            -ErrorAction SilentlyContinue
    }
}

function Sync-ArchLucidAzureCliSubscriptionContext
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId
    )

    [string]$trimmedSubscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId $SubscriptionId

    if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        return
    }

    if ($null -eq (Get-Command -Name az -ErrorAction SilentlyContinue))
    {
        return
    }

    & az account set --subscription $trimmedSubscriptionId 2>$null

    if ($LASTEXITCODE -ne 0)
    {
        Write-Host ("Azure CLI session is not scoped to subscription {0}. ActualCost collection will use the Az PowerShell session when az login is unavailable." -f $trimmedSubscriptionId) -ForegroundColor Yellow
    }
}

function Connect-ArchLucidAzureAccountForSubscription
{
    param(
        [string] $TenantId = "",

        [string] $SubscriptionId = ""
    )

    [string]$trimmedTenantId = "$TenantId".Trim()
    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId) -and -not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        $null = Connect-AzAccount `
            -Tenant $trimmedTenantId `
            -Subscription $trimmedSubscriptionId `
            -UseDeviceAuthentication `
            -ErrorAction Stop

        return
    }

    if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId))
    {
        $null = Connect-AzAccount `
            -Tenant $trimmedTenantId `
            -UseDeviceAuthentication `
            -ErrorAction Stop

        return
    }

    if (-not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        $null = Connect-AzAccount `
            -Subscription $trimmedSubscriptionId `
            -UseDeviceAuthentication `
            -ErrorAction Stop

        return
    }

    $null = Connect-AzAccount `
        -UseDeviceAuthentication `
        -ErrorAction Stop
}

function Ensure-ArchLucidAzureSubscriptionSession
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $TenantId = "",

        [switch] $SkipConnect
    )

    if ($SkipConnect)
    {
        return
    }

    [string]$trimmedSubscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId $SubscriptionId
    [string]$trimmedTenantId = "$TenantId".Trim()

    [System.Management.Automation.ActionPreference]$previousWarningPreference = $WarningPreference
    [object]$subscription = $null

    try
    {
        $WarningPreference = 'SilentlyContinue'
        $subscription = Get-AzSubscription `
            -SubscriptionId $trimmedSubscriptionId `
            -ErrorAction SilentlyContinue
    }
    finally
    {
        $WarningPreference = $previousWarningPreference
    }

    [string]$resolvedTenantId =
        if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId))
        {
            $trimmedTenantId
        }
        elseif ($null -ne $subscription)
        {
            "$( $subscription.TenantId )".Trim()
        }
        else
        {
            ""
        }

    if ($null -ne $subscription)
    {
        if (-not [string]::IsNullOrWhiteSpace($resolvedTenantId))
        {
            Clear-ArchLucidAzureAccountSessions -ExceptTenantIds @($resolvedTenantId)
        }

        [object]$currentContext = Get-AzContext -ErrorAction SilentlyContinue
        [string]$currentSubscriptionId = "$( $currentContext.Subscription.Id )".Trim()
        [string]$currentTenantId = "$( $currentContext.Tenant.Id )".Trim()

        if (-not (Test-ArchLucidAzureSubscriptionIdsMatch -Left $currentSubscriptionId -Right $trimmedSubscriptionId) -or
            (-not [string]::IsNullOrWhiteSpace($resolvedTenantId) -and $currentTenantId -ne $resolvedTenantId))
        {
            $null = Set-AzContext `
                -SubscriptionId $trimmedSubscriptionId `
                -Tenant $resolvedTenantId `
                -ErrorAction Stop
        }

        Sync-ArchLucidAzureCliSubscriptionContext -SubscriptionId $trimmedSubscriptionId
        return
    }

    Clear-ArchLucidAzureAccountSessions

    Write-Host ("Signing in to Azure for subscription {0}..." -f $trimmedSubscriptionId) -ForegroundColor Cyan
    Write-Host "Reader (or equivalent) at subscription scope is sufficient for read-only inventory collection." -ForegroundColor Cyan

    Connect-ArchLucidAzureAccountForSubscription `
        -TenantId $trimmedTenantId `
        -SubscriptionId $trimmedSubscriptionId

    Sync-ArchLucidAzureCliSubscriptionContext -SubscriptionId $trimmedSubscriptionId
}

function Ensure-ArchLucidAzureLogin
{
    param(
        [string] $TenantId,

        [string] $SubscriptionId,

        [switch] $SkipConnect
    )

    if ($SkipConnect)
    {
        return
    }

    [string]$trimmedTenantId = "$TenantId".Trim()
    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        Ensure-ArchLucidAzureSubscriptionSession `
            -SubscriptionId $trimmedSubscriptionId `
            -TenantId $trimmedTenantId

        return
    }

    [object]$context = Get-AzContext -ErrorAction SilentlyContinue

    [bool]$needLogin =
        $null -eq $context -or
        $null -eq $context.Account

    if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId) -and $null -ne $context)
    {
        [string]$contextTenantId = "$( $context.Tenant.Id )".Trim()

        if (-not [string]::IsNullOrWhiteSpace($contextTenantId))
        {
            $needLogin = $needLogin -or ($contextTenantId -ne $trimmedTenantId)
        }
    }

    if ($needLogin)
    {
        Write-Host "Signing in to Azure..." -ForegroundColor Cyan
        Write-Host "Reader (or equivalent) at subscription scope is sufficient for read-only inventory collection." -ForegroundColor Cyan

        Connect-ArchLucidAzureAccountForSubscription -TenantId $trimmedTenantId
    }
}

function Set-ArchLucidAzureExtractorSubscriptionContext
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $TenantId = "",

        [switch] $SkipConnect
    )

    Ensure-ArchLucidAzureSubscriptionSession `
        -SubscriptionId $SubscriptionId `
        -TenantId $TenantId `
        -SkipConnect:$SkipConnect
}

function Resolve-ArchLucidAzureSubscriptionDisplayName
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $SubscriptionId
    )

    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        return $null
    }

    [object]$subscription = $null

    try
    {
        $subscription = Get-AzSubscription `
            -SubscriptionId $trimmedSubscriptionId `
            -ErrorAction Stop
    }
    catch
    {
        return $null
    }

    if ($null -eq $subscription)
    {
        return $null
    }

    [string]$candidate = $null

    if ($subscription.PSObject.Properties.Name -contains 'Name')
    {
        $candidate = "$($subscription.Name)".Trim()
    }

    if ([string]::IsNullOrWhiteSpace($candidate))
    {
        return $null
    }

    # Azure subscription ids are GUIDs; the diagrams picker hides UUID-like labels.
    [guid]$parsed = [guid]::Empty

    if ([guid]::TryParse($candidate, [ref]$parsed))
    {
        return $null
    }

    if ($candidate.Length -gt 256)
    {
        return $candidate.Substring(0, 256)
    }

    return $candidate
}

function Resolve-ArchLucidAzureExtractorSubscriptionId
{
    param(
        [string] $SubscriptionId,

        [string] $TenantId = "",

        [switch] $SkipConnect
    )

    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()
    [string]$trimmedTenantId = "$TenantId".Trim()

    if ($env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT -eq "1")
    {
        if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
        {
            throw "Specify -SubscriptionId when ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT=1."
        }

        return $trimmedSubscriptionId
    }

    if (-not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        Ensure-ArchLucidAzureLogin `
            -TenantId $trimmedTenantId `
            -SubscriptionId $trimmedSubscriptionId `
            -SkipConnect:$SkipConnect

        return $trimmedSubscriptionId
    }

    Ensure-ArchLucidAzureLogin `
        -TenantId $trimmedTenantId `
        -SkipConnect:$SkipConnect

    [object]$context = Get-AzContext -ErrorAction SilentlyContinue
    [string]$contextSubscriptionId = "$( $context.Subscription.Id )".Trim()

    if ([string]::IsNullOrWhiteSpace($contextSubscriptionId))
    {
        throw "No Azure subscription in the current context. Sign in with Connect-AzAccount -Tenant '<tenant-id>' -UseDeviceAuthentication, pass -SubscriptionId, or use Set-AzContext."
    }

    return $contextSubscriptionId
}

function Resolve-ArchLucidAzureExtractorOutputPath
{
    param(
        [string] $OutputPath
    )

    [string]$trimmedOutputPath = "$OutputPath".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmedOutputPath))
    {
        return Join-Path (Get-Location).Path "archlucid-azure-package.zip"
    }

    return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($trimmedOutputPath)
}

function Resolve-SecureNowAzureExtractorOutputPath
{
    param(
        [string] $OutputPath
    )

    [string]$trimmedOutputPath = "$OutputPath".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmedOutputPath))
    {
        return Join-Path (Get-Location).Path "securenow-azure-package.zip"
    }

    return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($trimmedOutputPath)
}
