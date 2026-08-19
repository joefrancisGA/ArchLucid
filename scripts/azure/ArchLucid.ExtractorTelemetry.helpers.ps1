# ArchLucid - structured step logging and manifest telemetry for Get-ArchLucidAzurePackage.ps1

Set-StrictMode -Version Latest

function New-ArchLucidExtractorTelemetryContext
{
    return [ordered]@{
        steps = [System.Collections.Generic.List[object]]::new()
        warnings = [System.Collections.Generic.List[object]]::new()
    }
}

function Write-ArchLucidExtractorEvent
{
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Step,

        [Parameter(Mandatory = $true)]
        [ValidateSet('Info', 'Verbose', 'Warning', 'Error')]
        [string] $Level,

        [Parameter(Mandatory = $true)]
        [string] $Message,

        [hashtable] $Context = @{}
    )

    [string]$contextSuffix = ""

    if ($null -ne $Context -and $Context.Count -gt 0)
    {
        [string[]]$pairs = @(
            $Context.GetEnumerator() |
                Sort-Object Name |
                ForEach-Object { "{0}={1}" -f $_.Key, $_.Value }
        )

        if ($pairs.Count -gt 0)
        {
            $contextSuffix = " [" + ($pairs -join '; ') + "]"
        }
    }

    [string]$formatted = "ArchLucid Azure extractor | {0} | {1}{2}" -f $Step, $Message, $contextSuffix

    switch ($Level)
    {
        'Info'
        {
            Write-Host $formatted -ForegroundColor Cyan
        }

        'Verbose'
        {
            Write-Verbose $formatted
        }

        'Warning'
        {
            Write-Warning $formatted
        }

        'Error'
        {
            Write-Error $formatted
        }
    }
}

function Add-ArchLucidExtractorWarning
{
    param(
        [Parameter(Mandatory = $true)]
        $Telemetry,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Step,

        [Parameter(Mandatory = $true)]
        [string] $Message,

        [hashtable] $Context = @{}
    )

    if ($null -eq $Telemetry)
    {
        throw [System.ArgumentNullException]::new('Telemetry')
    }

    [void]$Telemetry.warnings.Add([ordered]@{
            step = $Step
            message = $Message
            context = if ($null -eq $Context -or $Context.Count -eq 0) { $null } else { $Context }
        })

    Write-ArchLucidExtractorEvent -Step $Step -Level Warning -Message $Message -Context $Context
}

function Complete-ArchLucidExtractorStep
{
    param(
        [Parameter(Mandatory = $true)]
        $Telemetry,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Step,

        [Parameter(Mandatory = $true)]
        [ValidateSet('Succeeded', 'SucceededWithFallback', 'Skipped', 'Failed')]
        [string] $Outcome,

        [System.Diagnostics.Stopwatch] $Stopwatch = $null,

        [string] $Detail = "",

        [hashtable] $Context = @{}
    )

    if ($null -eq $Telemetry)
    {
        throw [System.ArgumentNullException]::new('Telemetry')
    }

    [double]$durationSeconds = 0

    if ($null -ne $Stopwatch)
    {
        if ($Stopwatch.IsRunning)
        {
            $Stopwatch.Stop()
        }

        $durationSeconds = [Math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)
    }

    [void]$Telemetry.steps.Add([ordered]@{
            name = $Step
            outcome = $Outcome
            durationSeconds = $durationSeconds
            detail = if ([string]::IsNullOrWhiteSpace($Detail)) { $null } else { $Detail }
            context = if ($null -eq $Context -or $Context.Count -eq 0) { $null } else { $Context }
        })

    [string]$level = if ($Outcome -eq 'Failed') { 'Error' } elseif ($Outcome -eq 'SucceededWithFallback') { 'Warning' } else { 'Info' }

    [string]$summary = if ([string]::IsNullOrWhiteSpace($Detail))
    {
        "Step completed ($Outcome)."
    }
    else
    {
        "Step completed ($Outcome): $Detail"
    }

    Write-ArchLucidExtractorEvent -Step $Step -Level $level -Message $summary -Context $Context
}

function Write-ArchLucidExtractorFatal
{
    param(
        [Parameter(Mandatory = $true)]
        $Telemetry,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Step,

        [Parameter(Mandatory = $true)]
        [string] $Message,

        [System.Diagnostics.Stopwatch] $Stopwatch = $null,

        [hashtable] $Context = @{}
    )

    Complete-ArchLucidExtractorStep `
        -Telemetry $Telemetry `
        -Step $Step `
        -Outcome Failed `
        -Stopwatch $Stopwatch `
        -Detail $Message `
        -Context $Context

    Write-ArchLucidExtractorEvent -Step $Step -Level Error -Message $Message -Context $Context
}

function Get-ArchLucidExtractorTelemetryForManifest
{
    param(
        [Parameter(Mandatory = $true)]
        $Telemetry
    )

    if ($null -eq $Telemetry)
    {
        return $null
    }

    return [ordered]@{
        steps = @($Telemetry.steps)
        warnings = @($Telemetry.warnings)
        warningCount = $Telemetry.warnings.Count
    }
}

function New-ArchLucidEmptyPolicyComplianceDocument
{
    param(
        [Parameter(Mandatory = $true)]
        [string] $ScopeDescriptor,

        [Parameter(Mandatory = $true)]
        [string] $CollectionTimestampUtc,

        [Parameter(Mandatory = $true)]
        [string] $ReaderNote,

        [int] $PolicyComplianceSchemaVersion = 1
    )

    return [ordered]@{
        policyComplianceSchemaVersion = $PolicyComplianceSchemaVersion
        collectionTimestampUtc = $CollectionTimestampUtc
        scope = $ScopeDescriptor
        managementPlane = "AzurePolicyInsights"
        apiShape = "policyStates/latest/queryResults"
        readerNote = $ReaderNote
        recordCount = 0
        records = @()
    }
}
