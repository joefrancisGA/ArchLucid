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

        [object]$account = $context.Account
        [string]$accountId = "$( $account.Id )".Trim()
        [string]$accountType = ""

        if ($null -ne $account.PSObject.Properties['Type'])
        {
            $accountType = "$( $account.Type )".Trim()
        }

        if ($accountType -eq 'ServicePrincipal')
        {
            $null = Disconnect-AzAccount `
                -ApplicationId $accountId `
                -TenantId $contextTenantId `
                -Confirm:$false `
                -ErrorAction SilentlyContinue
        }
        else
        {
            $null = Disconnect-AzAccount `
                -Username $accountId `
                -Confirm:$false `
                -ErrorAction SilentlyContinue
        }
    }
}

function Test-ArchLucidAzureCliSessionMatchesSubscription
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId
    )

    if ($null -eq (Get-Command -Name az -ErrorAction SilentlyContinue))
    {
        return $false
    }

    [string]$trimmedSubscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId $SubscriptionId

    if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        return $false
    }

    try
    {
        [string]$azAccountJson = (& az account show --only-show-errors 2>$null | Out-String).Trim()

        if ([string]::IsNullOrWhiteSpace($azAccountJson))
        {
            return $false
        }

        [object]$azAccount = $azAccountJson | ConvertFrom-Json -ErrorAction Stop

        return Test-ArchLucidAzureSubscriptionIdsMatch `
            -Left "$( $azAccount.id )" `
            -Right $trimmedSubscriptionId
    }
    catch
    {
        return $false
    }
}

function Sync-ArchLucidAzureCliSessionFromAzContext
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $TenantId = ""
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

    if (Test-ArchLucidAzureCliSessionMatchesSubscription -SubscriptionId $trimmedSubscriptionId)
    {
        return
    }

    [object]$context = Get-AzContext -ErrorAction SilentlyContinue

    if ($null -eq $context -or $null -eq $context.Account)
    {
        Write-Host ("Azure CLI is not signed in. Cost collection via az rest may fail until you run az login for subscription {0}." -f $trimmedSubscriptionId) -ForegroundColor Yellow

        return
    }

    [string]$resolvedTenantId =
        if (-not [string]::IsNullOrWhiteSpace("$TenantId".Trim()))
        {
            "$TenantId".Trim()
        }
        else
        {
            "$( $context.Tenant.Id )".Trim()
        }

    [bool]$synced = $false

    if (-not [string]::IsNullOrWhiteSpace($resolvedTenantId))
    {
        try
        {
            [object]$accessToken = Get-AzAccessToken `
                -ResourceUrl "https://management.azure.com/" `
                -TenantId $resolvedTenantId `
                -ErrorAction Stop

            [string]$token = "$( $accessToken.Token )".Trim()

            if (-not [string]::IsNullOrWhiteSpace($token))
            {
                $null = & az login --access-token $token --tenant $resolvedTenantId --only-show-errors 2>$null

                if (Test-ArchLucidAzureCliSessionMatchesSubscription -SubscriptionId $trimmedSubscriptionId)
                {
                    return
                }

                $synced = $true
            }
        }
        catch
        {
        }
    }

    $null = & az account set --subscription $trimmedSubscriptionId --only-show-errors 2>$null

    if (Test-ArchLucidAzureCliSessionMatchesSubscription -SubscriptionId $trimmedSubscriptionId)
    {
        return
    }

    if (-not $synced)
    {
        Write-Host ("Azure CLI session is not scoped to subscription {0}. ActualCost collection will use the Az PowerShell session when az login is unavailable." -f $trimmedSubscriptionId) -ForegroundColor Yellow
    }
}

function Sync-ArchLucidAzureCliSubscriptionContext
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $TenantId = ""
    )

    Sync-ArchLucidAzureCliSessionFromAzContext `
        -SubscriptionId $SubscriptionId `
        -TenantId $TenantId
}

function Connect-ArchLucidAzureAccountForSubscription
{
    param(
        [string] $TenantId = "",

        [string] $SubscriptionId = "",

        [ValidateSet("Browser", "Credential", "DeviceCode")]
        [string] $AuthenticationMethod = "DeviceCode",

        [PSCredential] $Credential
    )

    [string]$trimmedTenantId = "$TenantId".Trim()
    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()
    [bool]$hasTenant = -not [string]::IsNullOrWhiteSpace($trimmedTenantId)
    [bool]$hasSubscription = -not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId)

    if ($AuthenticationMethod -eq "Credential")
    {
        if ($null -eq $Credential)
        {
            throw "Credential authentication requires a PSCredential."
        }

        if ($hasTenant -and $hasSubscription)
        {
            $null = Connect-AzAccount `
                -Tenant $trimmedTenantId `
                -Subscription $trimmedSubscriptionId `
                -Credential $Credential `
                -ErrorAction Stop

            return
        }

        if ($hasTenant)
        {
            $null = Connect-AzAccount `
                -Tenant $trimmedTenantId `
                -Credential $Credential `
                -ErrorAction Stop

            return
        }

        if ($hasSubscription)
        {
            $null = Connect-AzAccount `
                -Subscription $trimmedSubscriptionId `
                -Credential $Credential `
                -ErrorAction Stop

            return
        }

        $null = Connect-AzAccount `
            -Credential $Credential `
            -ErrorAction Stop

        return
    }

    if ($AuthenticationMethod -eq "DeviceCode")
    {
        if ($hasTenant -and $hasSubscription)
        {
            $null = Connect-AzAccount `
                -Tenant $trimmedTenantId `
                -Subscription $trimmedSubscriptionId `
                -UseDeviceAuthentication `
                -ErrorAction Stop

            return
        }

        if ($hasTenant)
        {
            $null = Connect-AzAccount `
                -Tenant $trimmedTenantId `
                -UseDeviceAuthentication `
                -ErrorAction Stop

            return
        }

        if ($hasSubscription)
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

        return
    }

    if ($hasTenant -and $hasSubscription)
    {
        $null = Connect-AzAccount `
            -Tenant $trimmedTenantId `
            -Subscription $trimmedSubscriptionId `
            -ErrorAction Stop

        return
    }

    if ($hasTenant)
    {
        $null = Connect-AzAccount `
            -Tenant $trimmedTenantId `
            -ErrorAction Stop

        return
    }

    if ($hasSubscription)
    {
        $null = Connect-AzAccount `
            -Subscription $trimmedSubscriptionId `
            -ErrorAction Stop

        return
    }

    $null = Connect-AzAccount -ErrorAction Stop
}

function Read-ArchLucidAzureCredentialFromPrompt
{
    [string]$userName = (Read-Host "Azure username or email").Trim()

    if ([string]::IsNullOrWhiteSpace($userName))
    {
        throw "Azure username is required for password sign-in."
    }

    [System.Security.SecureString]$securePassword = Read-Host "Azure password" -AsSecureString

    return [PSCredential]::new($userName, $securePassword)
}

function Resolve-ArchLucidAzureInteractiveAuthenticationMethod
{
    param(
        [ValidateSet("Browser", "Credential", "DeviceCode", "")]
        [string] $AuthenticationMethod = ""
    )

    [string]$trimmedMethod = "$AuthenticationMethod".Trim()

    if (-not [string]::IsNullOrWhiteSpace($trimmedMethod))
    {
        return $trimmedMethod
    }

    if (-not [Environment]::UserInteractive)
    {
        return "DeviceCode"
    }

    Write-Host ""
    Write-Host "How would you like to sign in to Azure?" -ForegroundColor Cyan
    Write-Host "  [1] Browser sign-in (recommended; supports multi-factor authentication)"
    Write-Host "  [2] Username and password (only when your organization allows password sign-in)"
    Write-Host "  [3] Device code (useful when a browser is unavailable on this machine)"
    Write-Host ""

    [string]$selection = (Read-Host "Sign-in method [1]").Trim()

    if ([string]::IsNullOrWhiteSpace($selection) -or $selection -eq "1")
    {
        return "Browser"
    }

    if ($selection -eq "2")
    {
        return "Credential"
    }

    if ($selection -eq "3")
    {
        return "DeviceCode"
    }

    throw "Invalid sign-in method '$selection'. Enter 1, 2, or 3."
}

function Get-ArchLucidAzureSubscriptionSelectionLabel
{
    param(
        [Parameter(Mandatory = $true)]
        [object] $Subscription
    )

    [string]$subscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId "$( $Subscription.Id )"
    [string]$displayName = ""

    if ($Subscription.PSObject.Properties.Name -contains "Name")
    {
        $displayName = "$( $Subscription.Name )".Trim()
    }

    if ([string]::IsNullOrWhiteSpace($displayName) -or (Test-ArchLucidAzureSubscriptionIdsMatch -Left $displayName -Right $subscriptionId))
    {
        return $subscriptionId
    }

    return "{0} ({1})" -f $displayName, $subscriptionId
}

function Get-ArchLucidAzureAccessibleSubscriptions
{
    param(
        [string] $TenantId = ""
    )

    [string]$trimmedTenantId = "$TenantId".Trim()
    [System.Management.Automation.ActionPreference]$previousWarningPreference = $WarningPreference
    [object[]]$subscriptions = @()

    try
    {
        $WarningPreference = "SilentlyContinue"
        $subscriptions = @(Get-AzSubscription -ErrorAction Stop)
    }
    catch
    {
        $subscriptions = @()
    }
    finally
    {
        $WarningPreference = $previousWarningPreference
    }

    if (-not [string]::IsNullOrWhiteSpace($trimmedTenantId))
    {
        $subscriptions = @(
            $subscriptions |
                Where-Object {
                    $null -ne $_ -and
                    ("$( $_.TenantId )".Trim() -eq $trimmedTenantId)
                }
        )
    }

    return @(
        $subscriptions |
            Sort-Object {
                [string]$label = Get-ArchLucidAzureSubscriptionSelectionLabel -Subscription $_

                return $label
            }
    )
}

function Resolve-ArchLucidAzureSubscriptionSelectionInput
{
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $Subscriptions,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $SelectionInput
    )

    [string]$trimmedSelection = "$SelectionInput".Trim()

    if ([string]::IsNullOrWhiteSpace($trimmedSelection))
    {
        return $null
    }

    if ($trimmedSelection -match '^\d+$')
    {
        [int]$selectionIndex = [int]$trimmedSelection

        if ($selectionIndex -ge 1 -and $selectionIndex -le $Subscriptions.Count)
        {
            return $Subscriptions[$selectionIndex - 1]
        }
    }

    foreach ($subscription in @($Subscriptions))
    {
        [string]$subscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId "$( $subscription.Id )"
        [string]$label = Get-ArchLucidAzureSubscriptionSelectionLabel -Subscription $subscription

        if (Test-ArchLucidAzureSubscriptionIdsMatch -Left $trimmedSelection -Right $subscriptionId)
        {
            return $subscription
        }

        if ($label -like "*$trimmedSelection*")
        {
            return $subscription
        }

        if ($subscription.PSObject.Properties.Name -contains "Name")
        {
            [string]$displayName = "$( $subscription.Name )".Trim()

            if ($displayName -like "*$trimmedSelection*")
            {
                return $subscription
            }
        }
    }

    return $null
}

function Select-ArchLucidAzureSubscriptionInteractive
{
    param(
        [string] $TenantId = "",

        [ValidateSet("Browser", "Credential", "DeviceCode", "")]
        [string] $AuthenticationMethod = ""
    )

    [string]$resolvedAuthenticationMethod = Resolve-ArchLucidAzureInteractiveAuthenticationMethod `
        -AuthenticationMethod $AuthenticationMethod

    [PSCredential]$credential = $null

    if ($resolvedAuthenticationMethod -eq "Credential")
    {
        $credential = Read-ArchLucidAzureCredentialFromPrompt
    }

    [object]$context = Get-AzContext -ErrorAction SilentlyContinue
    [bool]$needLogin = $null -eq $context -or $null -eq $context.Account

    if (-not [string]::IsNullOrWhiteSpace("$TenantId".Trim()) -and $null -ne $context)
    {
        [string]$contextTenantId = "$( $context.Tenant.Id )".Trim()

        if (-not [string]::IsNullOrWhiteSpace($contextTenantId) -and $contextTenantId -ne "$TenantId".Trim())
        {
            $needLogin = $true
        }
    }

    if ($needLogin)
    {
        Write-Host ""
        Write-Host "Signing in to Azure..." -ForegroundColor Cyan
        Write-Host "Reader (or equivalent) at subscription scope is sufficient for read-only inventory collection." -ForegroundColor Cyan

        Connect-ArchLucidAzureAccountForSubscription `
            -TenantId $TenantId `
            -AuthenticationMethod $resolvedAuthenticationMethod `
            -Credential $credential
    }

    [object[]]$subscriptions = @(Get-ArchLucidAzureAccessibleSubscriptions -TenantId $TenantId)

    if ($subscriptions.Count -eq 0)
    {
        throw "No Azure subscriptions are visible to the signed-in account. Ensure Reader (or equivalent) RBAC at subscription scope, then try again."
    }

    if ($subscriptions.Count -eq 1)
    {
        [string]$onlySubscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId "$( $subscriptions[0].Id )"
        [string]$onlyLabel = Get-ArchLucidAzureSubscriptionSelectionLabel -Subscription $subscriptions[0]

        Write-Host ""
        Write-Host ("Using the only accessible subscription: {0}" -f $onlyLabel) -ForegroundColor Cyan

        $null = Set-AzContext `
            -SubscriptionId $onlySubscriptionId `
            -Tenant $(if (-not [string]::IsNullOrWhiteSpace("$TenantId".Trim())) { "$TenantId".Trim() } else { "$( $subscriptions[0].TenantId )".Trim() }) `
            -ErrorAction Stop

        Sync-ArchLucidAzureCliSessionFromAzContext `
            -SubscriptionId $onlySubscriptionId `
            -TenantId $TenantId

        return $onlySubscriptionId
    }

    Write-Host ""
    Write-Host "Choose the subscription to extract:" -ForegroundColor Cyan

    for ([int]$index = 0; $index -lt $subscriptions.Count; $index++)
    {
        [string]$label = Get-ArchLucidAzureSubscriptionSelectionLabel -Subscription $subscriptions[$index]

        Write-Host ("  [{0}] {1}" -f ($index + 1), $label)
    }

    Write-Host ""
    Write-Host "Enter the list number, subscription name, or subscription id."

    [object]$selectedSubscription = $null

    while ($null -eq $selectedSubscription)
    {
        [string]$selectionInput = (Read-Host "Subscription").Trim()
        $selectedSubscription = Resolve-ArchLucidAzureSubscriptionSelectionInput `
            -Subscriptions $subscriptions `
            -SelectionInput $selectionInput

        if ($null -eq $selectedSubscription)
        {
            Write-Host "Could not match that subscription. Enter a list number, name, or id from the list above." -ForegroundColor Yellow
        }
    }

    [string]$selectedSubscriptionId = Get-ArchLucidAzureSubscriptionGuid -SubscriptionId "$( $selectedSubscription.Id )"
    [string]$selectedTenantId =
        if (-not [string]::IsNullOrWhiteSpace("$TenantId".Trim()))
        {
            "$TenantId".Trim()
        }
        else
        {
            "$( $selectedSubscription.TenantId )".Trim()
        }

    $null = Set-AzContext `
        -SubscriptionId $selectedSubscriptionId `
        -Tenant $selectedTenantId `
        -ErrorAction Stop

    Sync-ArchLucidAzureCliSessionFromAzContext `
        -SubscriptionId $selectedSubscriptionId `
        -TenantId $selectedTenantId

    return $selectedSubscriptionId
}

function Ensure-ArchLucidAzureSubscriptionSession
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $SubscriptionId,

        [string] $TenantId = "",

        [switch] $SkipConnect,

        [ValidateSet("Browser", "Credential", "DeviceCode")]
        [string] $AuthenticationMethod = "DeviceCode",

        [PSCredential] $Credential
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
            -ErrorAction Stop
    }
    catch
    {
        $subscription = $null
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

        Sync-ArchLucidAzureCliSubscriptionContext `
            -SubscriptionId $trimmedSubscriptionId `
            -TenantId $resolvedTenantId

        return
    }

    Clear-ArchLucidAzureAccountSessions

    Write-Host ("Signing in to Azure for subscription {0}..." -f $trimmedSubscriptionId) -ForegroundColor Cyan
    Write-Host "Reader (or equivalent) at subscription scope is sufficient for read-only inventory collection." -ForegroundColor Cyan

    [PSCredential]$resolvedCredential = $Credential

    if ($AuthenticationMethod -eq "Credential" -and $null -eq $resolvedCredential)
    {
        $resolvedCredential = Read-ArchLucidAzureCredentialFromPrompt
    }

    Connect-ArchLucidAzureAccountForSubscription `
        -TenantId $trimmedTenantId `
        -SubscriptionId $trimmedSubscriptionId `
        -AuthenticationMethod $AuthenticationMethod `
        -Credential $resolvedCredential

    Sync-ArchLucidAzureCliSubscriptionContext `
        -SubscriptionId $trimmedSubscriptionId `
        -TenantId $resolvedTenantId
}

function Ensure-ArchLucidAzureLogin
{
    param(
        [string] $TenantId,

        [string] $SubscriptionId,

        [switch] $SkipConnect,

        [ValidateSet("Browser", "Credential", "DeviceCode")]
        [string] $AuthenticationMethod = "DeviceCode",

        [PSCredential] $Credential
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
            -TenantId $trimmedTenantId `
            -AuthenticationMethod $AuthenticationMethod `
            -Credential $Credential

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

        [PSCredential]$resolvedCredential = $Credential

        if ($AuthenticationMethod -eq "Credential" -and $null -eq $resolvedCredential)
        {
            $resolvedCredential = Read-ArchLucidAzureCredentialFromPrompt
        }

        Connect-ArchLucidAzureAccountForSubscription `
            -TenantId $trimmedTenantId `
            -AuthenticationMethod $AuthenticationMethod `
            -Credential $resolvedCredential
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

        [switch] $SkipConnect,

        [switch] $NonInteractive,

        [ValidateSet("Browser", "Credential", "DeviceCode", "")]
        [string] $AuthenticationMethod = ""
    )

    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()
    [string]$trimmedTenantId = "$TenantId".Trim()
    [string]$resolvedAuthenticationMethod =
        if ([string]::IsNullOrWhiteSpace("$AuthenticationMethod".Trim()))
        {
            if ($NonInteractive)
            {
                "DeviceCode"
            }
            else
            {
                ""
            }
        }
        else
        {
            "$AuthenticationMethod".Trim()
        }

    if ($env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT -eq "1")
    {
        if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
        {
            throw "Specify -SubscriptionId when ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT=1."
        }

        return $trimmedSubscriptionId
    }

    if ($SkipConnect)
    {
        if (-not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
        {
            return $trimmedSubscriptionId
        }

        [object]$context = Get-AzContext -ErrorAction SilentlyContinue
        [string]$contextSubscriptionId = "$( $context.Subscription.Id )".Trim()

        if ([string]::IsNullOrWhiteSpace($contextSubscriptionId))
        {
            throw "No Azure subscription in the current context. Pass -SubscriptionId or sign in before using -SkipConnect."
        }

        return $contextSubscriptionId
    }

    if ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId) -and -not $NonInteractive)
    {
        return Select-ArchLucidAzureSubscriptionInteractive `
            -TenantId $trimmedTenantId `
            -AuthenticationMethod $resolvedAuthenticationMethod
    }

    if (-not [string]::IsNullOrWhiteSpace($trimmedSubscriptionId))
    {
        [string]$loginAuthenticationMethod =
            if ([string]::IsNullOrWhiteSpace($resolvedAuthenticationMethod))
            {
                "DeviceCode"
            }
            else
            {
                $resolvedAuthenticationMethod
            }

        Ensure-ArchLucidAzureLogin `
            -TenantId $trimmedTenantId `
            -SubscriptionId $trimmedSubscriptionId `
            -AuthenticationMethod $loginAuthenticationMethod

        return $trimmedSubscriptionId
    }

    Ensure-ArchLucidAzureLogin `
        -TenantId $trimmedTenantId `
        -AuthenticationMethod $(if ([string]::IsNullOrWhiteSpace($resolvedAuthenticationMethod)) { "DeviceCode" } else { $resolvedAuthenticationMethod })

    [object]$context = Get-AzContext -ErrorAction SilentlyContinue
    [string]$contextSubscriptionId = "$( $context.Subscription.Id )".Trim()

    if ([string]::IsNullOrWhiteSpace($contextSubscriptionId))
    {
        throw "No Azure subscription in the current context. Sign in with Connect-AzAccount -Tenant '<tenant-id>' -UseDeviceAuthentication, pass -SubscriptionId, or rerun without -NonInteractive to choose a subscription."
    }

    Sync-ArchLucidAzureCliSubscriptionContext `
        -SubscriptionId $contextSubscriptionId `
        -TenantId $trimmedTenantId

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
