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

        Import-Module Az.Accounts, Az.Resources -ErrorAction Stop

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

    Import-Module Az.Accounts, Az.Resources -ErrorAction Stop
}

function Resolve-ArchLucidAzureExtractorSubscriptionId
{
    param(
        [string] $SubscriptionId,

        [switch] $SkipConnect
    )

    [string]$trimmedSubscriptionId = "$SubscriptionId".Trim()

    if (-not ([string]::IsNullOrWhiteSpace($trimmedSubscriptionId)))
    {
        return $trimmedSubscriptionId
    }

    if ($env:ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT -eq "1")
    {
        throw "Specify -SubscriptionId when ARCHLUCID_EXTRACTOR_SKIP_MODULE_PREFLIGHT=1."
    }

    [object]$context = Get-AzContext -ErrorAction SilentlyContinue

    if ($null -eq $context -and -not $SkipConnect)
    {
        Write-Host "Sign in to Azure. Reader (or equivalent) at subscription scope is sufficient for read-only inventory collection." -ForegroundColor Cyan

        $null = Connect-AzAccount
        $context = Get-AzContext
    }

    [string]$contextSubscriptionId = "$( $context.Subscription.Id )".Trim()

    if ([string]::IsNullOrWhiteSpace($contextSubscriptionId))
    {
        throw "No Azure subscription in the current context. Run Connect-AzAccount, pass -SubscriptionId, or use Set-AzContext."
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
