# Out-of-process watchdog for dotnet test integration chunks on CI Linux runners.
# In-process --blame-hang collectors die with a wedged test host; the parent captures dumps first.
Set-StrictMode -Version Latest

$script:DotNetDumpToolVersion = '9.0.621003'
$script:DotNetDumpCollectTimeoutSeconds = 120

function ConvertTo-ChunkTimeoutSpan {
    param(
        [Parameter(Mandatory)]
        [string]$ChunkTimeout
    )

    $trimmed = $ChunkTimeout.Trim()

    if ($trimmed -match '^(\d+(?:\.\d+)?)\s*min(?:ute)?s?$') {
        return [TimeSpan]::FromMinutes([double]$Matches[1])
    }

    if ($trimmed -match '^(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?$') {
        return [TimeSpan]::FromSeconds([double]$Matches[1])
    }

    return [TimeSpan]::Parse($trimmed)
}

function Get-DescendantProcessIds {
    param(
        [Parameter(Mandatory)]
        [int]$RootProcessId
    )

    $visited = [System.Collections.Generic.HashSet[int]]::new()
    $queue = [System.Collections.Generic.Queue[int]]::new()
    $queue.Enqueue($RootProcessId)

    while ($queue.Count -gt 0) {
        $currentProcessId = $queue.Dequeue()

        if (-not $visited.Add($currentProcessId)) {
            continue
        }

        if ($IsLinux) {
            $childOutput = & pgrep -P $currentProcessId 2>$null

            if ($null -ne $childOutput) {
                foreach ($childLine in @($childOutput)) {
                    $childText = $childLine.ToString().Trim()

                    if ($childText -match '^\d+$') {
                        $queue.Enqueue([int]$childText)
                    }
                }
            }

            continue
        }

        $childProcesses = Get-CimInstance Win32_Process -Filter "ParentProcessId = $currentProcessId" -ErrorAction SilentlyContinue

        foreach ($childProcess in $childProcesses) {
            $queue.Enqueue([int]$childProcess.ProcessId)
        }
    }

    return ,@($visited.ToArray())
}

function Get-IntegrationTestWorkerProcessIds {
    param(
        [Parameter(Mandatory)]
        [int]$RootProcessId,

        [Parameter(Mandatory)]
        [int]$CurrentProcessId
    )

    $descendantIds = Get-DescendantProcessIds -RootProcessId $RootProcessId
    $workerIds = [System.Collections.Generic.List[int]]::new()

    foreach ($processId in $descendantIds) {
        if ($processId -eq $CurrentProcessId) {
            continue
        }

        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

        if ($null -eq $process) {
            continue
        }

        if ($process.ProcessName -notin @('dotnet', 'testhost')) {
            continue
        }

        $workerIds.Add($processId)
    }

    return ,@($workerIds.ToArray())
}

function Get-DotNetDumpExecutablePath {
    $command = Get-Command -Name dotnet-dump -ErrorAction SilentlyContinue

    if ($null -ne $command) {
        return $command.Source
    }

    $homeDirectory = if ($null -ne $env:HOME -and $env:HOME.Length -gt 0) { $env:HOME } else { $env:USERPROFILE }
    $defaultPath = Join-Path $homeDirectory '.dotnet/tools/dotnet-dump'

    if ($IsLinux -and (Test-Path -LiteralPath $defaultPath)) {
        return $defaultPath
    }

    if (-not $IsLinux -and (Test-Path -LiteralPath "$defaultPath.exe")) {
        return "$defaultPath.exe"
    }

    return $null
}

function Ensure-DotNetDumpTool {
    $existingPath = Get-DotNetDumpExecutablePath

    if ($null -ne $existingPath) {
        Write-Host ("dotnet-dump already available at {0}" -f $existingPath)
        return $existingPath
    }

    Write-Host ("Installing dotnet-dump global tool (version {0}) ..." -f $script:DotNetDumpToolVersion)
    & dotnet tool install -g dotnet-dump --version $script:DotNetDumpToolVersion

    if ($LASTEXITCODE -ne 0) {
        throw "dotnet tool install -g dotnet-dump failed with exit code $LASTEXITCODE."
    }

    $installedPath = Get-DotNetDumpExecutablePath

    if ($null -eq $installedPath) {
        throw 'dotnet-dump was installed but could not be resolved on PATH.'
    }

    Write-Host ("dotnet-dump installed at {0}" -f $installedPath)
    return $installedPath
}

function Invoke-DotNetDumpCollectBounded {
    param(
        [Parameter(Mandatory)]
        [string]$DotNetDumpPath,

        [Parameter(Mandatory)]
        [int]$ProcessId,

        [Parameter(Mandatory)]
        [string]$OutputPath,

        [int]$TimeoutSeconds = $script:DotNetDumpCollectTimeoutSeconds
    )

    $collectJob = Start-Job -ScriptBlock {
        param($ToolPath, $TargetProcessId, $DumpPath)
        Set-StrictMode -Version Latest
        & $ToolPath collect -p $TargetProcessId --type Full -o $DumpPath
        exit $LASTEXITCODE
    } -ArgumentList $DotNetDumpPath, $ProcessId, $OutputPath

    $deadline = [datetime]::UtcNow.AddSeconds($TimeoutSeconds)

    try {
        while ($collectJob.State -eq 'Running') {
            if ([datetime]::UtcNow -ge $deadline) {
                Write-Host ("dotnet-dump collect timed out after {0}s for PID {1}" -f $TimeoutSeconds, $ProcessId)
                Stop-Job -Job $collectJob -Force -ErrorAction SilentlyContinue
                return $false
            }

            Start-Sleep -Seconds 2
        }

        $output = Receive-Job -Job $collectJob -Wait -AutoRemoveJob -ErrorAction SilentlyContinue

        if ($null -ne $output) {
            $output | ForEach-Object { Write-Host $_ }
        }

        if ($collectJob.ChildJobs[0].JobStateInfo.State -eq 'Failed') {
            $reason = $collectJob.ChildJobs[0].JobStateInfo.Reason

            if ($null -ne $reason) {
                Write-Host ("dotnet-dump collect failed for PID {0}: {1}" -f $ProcessId, $reason.Message)
            }

            return $false
        }

        return (Test-Path -LiteralPath $OutputPath)
    }
    finally {
        if ($collectJob.State -eq 'Running') {
            Stop-Job -Job $collectJob -Force -ErrorAction SilentlyContinue
            Remove-Job -Job $collectJob -Force -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-IntegrationTestHangDumpCapture {
    param(
        [Parameter(Mandatory)]
        [int]$RootProcessId,

        [Parameter(Mandatory)]
        [int]$ShardIndex,

        [Parameter(Mandatory)]
        [int]$ChunkNumber,

        [Parameter(Mandatory)]
        [string]$ResultsDirectory
    )

    $dotnetDumpPath = Ensure-DotNetDumpTool
    $workerProcessIds = Get-IntegrationTestWorkerProcessIds `
        -RootProcessId $RootProcessId `
        -CurrentProcessId $PID

    if ($workerProcessIds.Count -eq 0) {
        Write-Host 'No dotnet/testhost worker processes found in the chunk process tree; skipping dump capture.'
        return
    }

    foreach ($workerProcessId in $workerProcessIds) {
        $dumpPath = Join-Path $ResultsDirectory (
            "hangdump-shard-{0}-chunk{1}-{2}.dmp" -f $ShardIndex, $ChunkNumber, $workerProcessId
        )

        Write-Host ("Capturing out-of-process dump for PID {0} -> {1}" -f $workerProcessId, $dumpPath)

        try {
            $captured = Invoke-DotNetDumpCollectBounded `
                -DotNetDumpPath $dotnetDumpPath `
                -ProcessId $workerProcessId `
                -OutputPath $dumpPath

            if (-not $captured) {
                Write-Host ("Dump capture did not produce a file for PID {0}" -f $workerProcessId)
            }
        }
        catch {
            Write-Host ("Dump capture failed for PID {0}: {1}" -f $workerProcessId, $_.Exception.Message)
        }
    }
}

function Stop-IntegrationTestProcessTree {
    param(
        [Parameter(Mandatory)]
        [System.Diagnostics.Process]$RootProcess
    )

    if (-not $RootProcess.HasExited) {
        try {
            $RootProcess.Kill($true)
        }
        catch {
            Write-Host ("Root process kill failed: {0}" -f $_.Exception.Message)
        }
    }

    $descendantIds = Get-DescendantProcessIds -RootProcessId $RootProcess.Id

    foreach ($processId in $descendantIds) {
        if ($processId -eq $PID) {
            continue
        }

        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }

    Get-Process -Name 'dotnet', 'testhost' -ErrorAction SilentlyContinue |
        Where-Object { $_.Id -ne $PID } |
        Stop-Process -Force -ErrorAction SilentlyContinue
}

function Write-ChunkRedirectLogTail {
    param(
        [Parameter(Mandatory)]
        [string]$Label,

        [Parameter(Mandatory)]
        [string]$LogPath,

        [int]$TailLineCount = 120
    )

    Write-Host ''
    Write-Host ('===== {0} (last {1} lines): {2} =====' -f $Label, $TailLineCount, $LogPath)

    if (-not (Test-Path -LiteralPath $LogPath)) {
        Write-Host '(log file missing)'
        return
    }

    $lines = @(Get-Content -LiteralPath $LogPath -ErrorAction SilentlyContinue)

    if ($null -eq $lines -or $lines.Count -eq 0) {
        Write-Host '(log file empty)'
        return
    }

    $startIndex = [Math]::Max(0, $lines.Count - $TailLineCount)

    for ($lineIndex = $startIndex; $lineIndex -lt $lines.Count; $lineIndex++) {
        Write-Host $lines[$lineIndex]
    }
}

function Invoke-DotNetTestChunkWithWatchdog {
    param(
        [Parameter(Mandatory)]
        [string]$ProjectPath,

        [Parameter(Mandatory)]
        [string]$Configuration,

        [Parameter(Mandatory)]
        [string]$Filter,

        [Parameter(Mandatory)]
        [string]$RunSettingsPath,

        [Parameter(Mandatory)]
        [string]$ResultsDirectory,

        [Parameter(Mandatory)]
        [int]$ShardIndex,

        [Parameter(Mandatory)]
        [int]$ChunkNumber,

        [Parameter(Mandatory)]
        [string]$DiagLogPath,

        [Parameter(Mandatory)]
        [string]$BlameHangTimeout,

        [Parameter(Mandatory)]
        [TimeSpan]$ChunkTimeout
    )

    $stdoutLogPath = Join-Path $ResultsDirectory (
        "chunk-$ShardIndex-$ChunkNumber.stdout.log"
    )
    $stderrLogPath = Join-Path $ResultsDirectory (
        "chunk-$ShardIndex-$ChunkNumber.stderr.log"
    )

    $argumentList = @(
        'test', $ProjectPath,
        '--no-build',
        '-c', $Configuration,
        '--settings', $RunSettingsPath,
        '--filter', $Filter,
        # Do NOT pass --collect here: Start-Process -ArgumentList joins array elements with spaces
        # without quoting, so "--collect:XPlat Code Coverage" splits into three tokens and MSBuild
        # treats "Code" and "Coverage" as extra project paths (MSB1008). The XPlat Code Coverage
        # collector is already declared in coverage.runsettings, matching the non-integration job path.
        '--results-directory', $ResultsDirectory,
        '--logger', 'console;verbosity=minimal',
        '--logger', "trx;LogFilePrefix=full-core-api-integration-shard-$ShardIndex-chunk$ChunkNumber-",
        '--diag', $DiagLogPath,
        '--blame-hang',
        '--blame-hang-timeout', $BlameHangTimeout,
        '--blame-hang-dump-type', 'mini'
    )

    $process = Start-Process `
        -FilePath 'dotnet' `
        -ArgumentList $argumentList `
        -PassThru `
        -NoNewWindow `
        -RedirectStandardOutput $stdoutLogPath `
        -RedirectStandardError $stderrLogPath

    $deadline = [datetime]::UtcNow.Add($ChunkTimeout)
    $timedOut = $false
    $heartbeatIntervalSeconds = 8

    while (-not $process.HasExited) {
        if ([datetime]::UtcNow -ge $deadline) {
            $timedOut = $true
            Write-Host ("Chunk watchdog timeout ({0}) reached at {1}" -f $ChunkTimeout, (Get-Date -Format 'HH:mm:ss'))

            # Parent captures dumps before killing the tree — in-process blame collectors die with the host.
            Invoke-IntegrationTestHangDumpCapture `
                -RootProcessId $process.Id `
                -ShardIndex $ShardIndex `
                -ChunkNumber $ChunkNumber `
                -ResultsDirectory $ResultsDirectory

            if ($IsLinux -or [bool]$env:GITHUB_ACTIONS) {
                Write-CiSqlServerHangDiagnostics
            }

            Stop-IntegrationTestProcessTree -RootProcess $process
            break
        }

        Write-Host ("STILL EXECUTING... {0}" -f (Get-Date -Format 'HH:mm:ss'))
        Start-Sleep -Seconds $heartbeatIntervalSeconds
    }

    if (-not $timedOut) {
        $process.WaitForExit()
    }

    $exitCode = if ($timedOut) { 1 } else { $process.ExitCode }

    if ($exitCode -ne 0) {
        Write-Host ("dotnet test chunk exited with code {0}" -f $exitCode)

        # dotnet test stdout/stderr are redirected to chunk-*.log; without echoing them here and
        # uploading them in ci.yml, fast test-host crashes leave no visible failure in the job log.
        Write-ChunkRedirectLogTail -Label 'dotnet test chunk stdout' -LogPath $stdoutLogPath
        Write-ChunkRedirectLogTail -Label 'dotnet test chunk stderr' -LogPath $stderrLogPath
    }

    return $exitCode
}
