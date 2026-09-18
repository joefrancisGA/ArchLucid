# ArchLucid - console progress heartbeat for Get-ArchLucidAzurePackage.ps1
# Azure ARM / Cost Management / Policy calls block the main thread, so ticks run in a background
# runspace and write to [Console]::Out (the caller's command prompt).

function Resolve-ArchLucidExtractorProgressHeartbeatIntervalSeconds
{
    [int]$defaultSeconds = 10
    [string]$raw = [string]$env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS

    if ([string]::IsNullOrWhiteSpace($raw))
    {
        return $defaultSeconds
    }

    [int]$parsed = 0

    if (-not [int]::TryParse($raw.Trim(), [ref]$parsed))
    {
        return $defaultSeconds
    }

    if ($parsed -lt 0)
    {
        return $defaultSeconds
    }

    return $parsed
}

function Format-ArchLucidExtractorProgressHeartbeatMessage
{
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Step,

        [Parameter(Mandatory = $true)]
        [TimeSpan] $Elapsed
    )

    [string]$safeStep = $Step

    if ([string]::IsNullOrWhiteSpace($safeStep))
    {
        $safeStep = 'Working'
    }
    else
    {
        $safeStep = $safeStep.Trim()
    }

    [int]$hours = [Math]::Floor($Elapsed.TotalHours)
    [string]$clock = '{0:00}:{1:00}:{2:00}' -f $hours, $Elapsed.Minutes, $Elapsed.Seconds

    return ('ArchLucid Azure extractor | {0} | Still running... {1}' -f $safeStep, $clock)
}

function New-ArchLucidExtractorProgressHeartbeatState
{
    param(
        [string] $Step = 'Working',

        [int] $IntervalSeconds = 10
    )

    [string]$initialStep = $Step

    if ([string]::IsNullOrWhiteSpace($initialStep))
    {
        $initialStep = 'Working'
    }

    return [hashtable]::Synchronized(@{
            Running = $false
            Step = $initialStep.Trim()
            IntervalSeconds = $IntervalSeconds
            StartedUtc = [datetime]::UtcNow
            StepStartedUtc = [datetime]::UtcNow
            TickCount = 0
            WriteToConsole = $true
            Lines = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
        })
}

function Get-ArchLucidExtractorProgressHeartbeatWorkerScript
{
    # Nested formatter keeps the background runspace self-contained (parent functions are not imported).
    return {
        param($State)

        Set-StrictMode -Version Latest

        if ($null -eq $State)
        {
            return
        }

        function Format-ArchLucidExtractorProgressHeartbeatMessage
        {
            param(
                [string] $Step,
                [TimeSpan] $Elapsed
            )

            [string]$safeStep = $Step

            if ([string]::IsNullOrWhiteSpace($safeStep))
            {
                $safeStep = 'Working'
            }
            else
            {
                $safeStep = $safeStep.Trim()
            }

            [int]$hours = [Math]::Floor($Elapsed.TotalHours)
            [string]$clock = '{0:00}:{1:00}:{2:00}' -f $hours, $Elapsed.Minutes, $Elapsed.Seconds

            return ('ArchLucid Azure extractor | {0} | Still running... {1}' -f $safeStep, $clock)
        }

        [int]$sleptMs = 0

        while ([bool]$State.Running)
        {
            Start-Sleep -Milliseconds 200

            if (-not [bool]$State.Running)
            {
                break
            }

            $sleptMs += 200
            [int]$intervalMs = ([int]$State.IntervalSeconds) * 1000

            if ($intervalMs -le 0)
            {
                break
            }

            if ($sleptMs -lt $intervalMs)
            {
                continue
            }

            $sleptMs = 0

            [string]$step = [string]$State.Step
            [datetime]$nowUtc = [datetime]::UtcNow
            [datetime]$stepStartedUtc = [datetime]$State.StepStartedUtc
            [timespan]$elapsed = $nowUtc - $stepStartedUtc

            # A pulse can land in the same 200ms slice as a step change; skip 00:00:00 lines.
            if ($elapsed.TotalSeconds -lt 1)
            {
                continue
            }

            [string]$line = Format-ArchLucidExtractorProgressHeartbeatMessage -Step $step -Elapsed $elapsed

            $State.TickCount = ([int]$State.TickCount) + 1

            if ($null -ne $State.Lines)
            {
                [void]$State.Lines.Enqueue($line)
            }

            if ([bool]$State.WriteToConsole)
            {
                [Console]::Out.WriteLine($line)
                [Console]::Out.Flush()
            }
        }
    }
}

function Start-ArchLucidExtractorProgressHeartbeat
{
    param(
        [string] $InitialStep = 'Working',

        [int] $IntervalSeconds = -1,

        [switch] $Quiet
    )

    [int]$resolvedInterval = $IntervalSeconds

    if ($resolvedInterval -lt 0)
    {
        $resolvedInterval = Resolve-ArchLucidExtractorProgressHeartbeatIntervalSeconds
    }

    [hashtable]$state = New-ArchLucidExtractorProgressHeartbeatState `
        -Step $InitialStep `
        -IntervalSeconds $resolvedInterval

    $state.WriteToConsole = -not [bool]$Quiet
    $state.Running = $true

    [pscustomobject]$handle = [pscustomobject]@{
        Enabled     = $false
        State       = $state
        PowerShell  = $null
        Runspace    = $null
        AsyncResult = $null
    }

    if ($resolvedInterval -le 0)
    {
        $state.Running = $false
        return $handle
    }

    [runspace]$runspace = [runspacefactory]::CreateRunspace()
    $runspace.Open()

    [powershell]$pipeline = [powershell]::Create()
    $pipeline.Runspace = $runspace
    [void]$pipeline.AddScript([string](Get-ArchLucidExtractorProgressHeartbeatWorkerScript)).AddArgument($state)

    $handle.Enabled = $true
    $handle.PowerShell = $pipeline
    $handle.Runspace = $runspace
    $handle.AsyncResult = $pipeline.BeginInvoke()

    return $handle
}

function Set-ArchLucidExtractorProgressHeartbeatStep
{
    param(
        $Handle,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Step
    )

    if ($null -eq $Handle)
    {
        return
    }

    if ($null -eq $Handle.State)
    {
        return
    }

    $Handle.State.Step = $Step.Trim()
    $Handle.State.StepStartedUtc = [datetime]::UtcNow
}

function Enter-ArchLucidExtractorProgressStep
{
    param(
        $Handle,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Step,

        [hashtable] $Context = @{}
    )

    Set-ArchLucidExtractorProgressHeartbeatStep -Handle $Handle -Step $Step

    [hashtable]$eventContext = @{}

    if ($null -ne $Context)
    {
        $eventContext = $Context
    }

    if (Get-Command -Name Write-ArchLucidExtractorEvent -ErrorAction SilentlyContinue)
    {
        Write-ArchLucidExtractorEvent -Step $Step -Level Info -Message 'Step started.' -Context $eventContext
        return
    }

    Write-Host ('ArchLucid Azure extractor | {0} | Step started.' -f $Step) -ForegroundColor Cyan
}

function Stop-ArchLucidExtractorProgressHeartbeat
{
    param(
        $Handle
    )

    if ($null -eq $Handle)
    {
        return
    }

    if ($null -ne $Handle.State)
    {
        $Handle.State.Running = $false
    }

    if (-not [bool]$Handle.Enabled)
    {
        return
    }

    if ($null -eq $Handle.PowerShell)
    {
        $Handle.Enabled = $false
        return
    }

    try
    {
        [int]$waitedMs = 0

        while (($null -ne $Handle.AsyncResult) -and (-not $Handle.AsyncResult.IsCompleted) -and ($waitedMs -lt 3000))
        {
            Start-Sleep -Milliseconds 100
            $waitedMs += 100
        }

        if (($null -ne $Handle.AsyncResult) -and $Handle.AsyncResult.IsCompleted)
        {
            [void]$Handle.PowerShell.EndInvoke($Handle.AsyncResult)
        }
        else
        {
            $Handle.PowerShell.Stop()
        }
    }
    finally
    {
        $Handle.PowerShell.Dispose()
        $Handle.PowerShell = $null

        if ($null -ne $Handle.Runspace)
        {
            $Handle.Runspace.Dispose()
            $Handle.Runspace = $null
        }

        $Handle.AsyncResult = $null
        $Handle.Enabled = $false
    }
}
