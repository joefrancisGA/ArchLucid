#Requires -Version 7.0
# Run: Invoke-Pester -Strict 'scripts/azure/tests/ArchLucid.ExtractorProgressHeartbeat.helpers.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'ArchLucid.ExtractorProgressHeartbeat.helpers.ps1' {

    BeforeAll {
        [string]$script:helpersPath =
            Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.ExtractorProgressHeartbeat.helpers.ps1'
        [string]$script:telemetryPath =
            Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.ExtractorTelemetry.helpers.ps1'

        . $script:telemetryPath
        . $script:helpersPath

        $script:heartbeatHandle = $null
    }

    AfterEach {
        if ($null -ne $script:heartbeatHandle)
        {
            Stop-ArchLucidExtractorProgressHeartbeat -Handle $script:heartbeatHandle
            $script:heartbeatHandle = $null
        }
    }

    It 'uses the configured console brand name in still-running lines' {
        [string]$previousBrand = Get-ArchLucidExtractorConsoleBrandName

        try
        {
            Set-ArchLucidExtractorConsoleBrandName -BrandName 'SecureNow Azure extractor'

            [string]$line = Format-ArchLucidExtractorProgressHeartbeatMessage `
                -Step 'ActualCostSummary' `
                -Elapsed ([TimeSpan]::FromSeconds(12))

            $line | Should -Be 'SecureNow Azure extractor | ActualCostSummary | Still running... 00:00:12'
        }
        finally
        {
            Set-ArchLucidExtractorConsoleBrandName -BrandName $previousBrand
        }
    }

    It 'formats a still-running line with step name and elapsed clock' {
        [string]$line = Format-ArchLucidExtractorProgressHeartbeatMessage `
            -Step 'ActualCostSummary' `
            -Elapsed ([TimeSpan]::FromSeconds(12))

        $line | Should -Be 'ArchLucid Azure extractor | ActualCostSummary | Still running... 00:00:12'
    }

    It 'uses Working when the step name is blank' {
        [string]$line = Format-ArchLucidExtractorProgressHeartbeatMessage `
            -Step '' `
            -Elapsed ([TimeSpan]::FromMinutes(2) + [TimeSpan]::FromSeconds(5))

        $line | Should -Be 'ArchLucid Azure extractor | Working | Still running... 00:02:05'
    }

    It 'defaults the heartbeat interval to 10 seconds' {
        [string]$previous = $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS

        try
        {
            Remove-Item Env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS -ErrorAction SilentlyContinue
            Resolve-ArchLucidExtractorProgressHeartbeatIntervalSeconds | Should -Be 10
        }
        finally
        {
            if ($null -eq $previous)
            {
                Remove-Item Env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS -ErrorAction SilentlyContinue
            }
            else
            {
                $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS = $previous
            }
        }
    }

    It 'honors a zero interval as disabled and rejects invalid env values' {
        [string]$previous = $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS

        try
        {
            $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS = '0'
            Resolve-ArchLucidExtractorProgressHeartbeatIntervalSeconds | Should -Be 0

            $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS = 'nope'
            Resolve-ArchLucidExtractorProgressHeartbeatIntervalSeconds | Should -Be 10

            $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS = '-3'
            Resolve-ArchLucidExtractorProgressHeartbeatIntervalSeconds | Should -Be 10
        }
        finally
        {
            if ($null -eq $previous)
            {
                Remove-Item Env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS -ErrorAction SilentlyContinue
            }
            else
            {
                $env:ARCHLUCID_EXTRACTOR_PROGRESS_HEARTBEAT_SECONDS = $previous
            }
        }
    }

    It 'does not start a worker when the interval is zero' {
        $script:heartbeatHandle = Start-ArchLucidExtractorProgressHeartbeat -InitialStep 'Inventory' -IntervalSeconds 0 -Quiet

        $script:heartbeatHandle.Enabled | Should -BeFalse
        [int]$script:heartbeatHandle.State.TickCount | Should -Be 0
        $null -eq $script:heartbeatHandle.PowerShell | Should -BeTrue
    }

    It 'emits queued still-running lines on the requested interval and stops cleanly' {
        $script:heartbeatHandle = Start-ArchLucidExtractorProgressHeartbeat `
            -InitialStep 'PolicyDefinitions' `
            -IntervalSeconds 1 `
            -Quiet

        $script:heartbeatHandle.Enabled | Should -BeTrue

        [datetime]$deadline = [datetime]::UtcNow.AddSeconds(6)

        while (([datetime]::UtcNow -lt $deadline) -and ([int]$script:heartbeatHandle.State.TickCount -lt 2))
        {
            Start-Sleep -Milliseconds 200
        }

        [int]$script:heartbeatHandle.State.TickCount | Should -BeGreaterOrEqual 2

        [string]$queued = $null
        [bool]$dequeued = $script:heartbeatHandle.State.Lines.TryPeek([ref]$queued)
        $dequeued | Should -BeTrue
        $queued | Should -Match 'ArchLucid Azure extractor \| PolicyDefinitions \| Still running\.\.\. 00:00:0'

        [int]$ticksAtStop = [int]$script:heartbeatHandle.State.TickCount
        Stop-ArchLucidExtractorProgressHeartbeat -Handle $script:heartbeatHandle
        $script:heartbeatHandle.Enabled | Should -BeFalse

        Start-Sleep -Milliseconds 1200
        [int]$script:heartbeatHandle.State.TickCount | Should -Be $ticksAtStop

        Stop-ArchLucidExtractorProgressHeartbeat -Handle $script:heartbeatHandle
        $script:heartbeatHandle = $null
    }

    It 'updates the step name used by later heartbeat lines' {
        $script:heartbeatHandle = Start-ArchLucidExtractorProgressHeartbeat `
            -InitialStep 'Inventory' `
            -IntervalSeconds 1 `
            -Quiet

        [datetime]$firstDeadline = [datetime]::UtcNow.AddSeconds(4)

        while (([datetime]::UtcNow -lt $firstDeadline) -and ([int]$script:heartbeatHandle.State.TickCount -lt 1))
        {
            Start-Sleep -Milliseconds 150
        }

        Enter-ArchLucidExtractorProgressStep -Handle $script:heartbeatHandle -Step 'ActualCostSummary'
        $script:heartbeatHandle.State.Step | Should -Be 'ActualCostSummary'

        [datetime]$secondDeadline = [datetime]::UtcNow.AddSeconds(5)
        [bool]$sawCostStep = $false

        while ([datetime]::UtcNow -lt $secondDeadline)
        {
            [string[]]$lines = @($script:heartbeatHandle.State.Lines.ToArray())

            if (@($lines | Where-Object { $_ -match 'ActualCostSummary' }).Count -gt 0)
            {
                $sawCostStep = $true
                break
            }

            Start-Sleep -Milliseconds 150
        }

        $sawCostStep | Should -BeTrue
    }

    It 'is a no-op when stopping or setting a null handle' {
        { Stop-ArchLucidExtractorProgressHeartbeat -Handle $null } | Should -Not -Throw
        { Set-ArchLucidExtractorProgressHeartbeatStep -Handle $null -Step 'Inventory' } | Should -Not -Throw
    }
}
