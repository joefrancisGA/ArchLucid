# Out-of-process watchdog for dotnet test integration chunks on CI Linux runners.
# In-process --blame-hang collectors die with a wedged test host; the parent captures dumps first.
Set-StrictMode -Version Latest

$script:DotNetDumpToolVersion = '9.0.621003'
$script:DotNetStackToolVersion = '9.0.621003'
$script:DotNetDumpCollectTimeoutSeconds = 60
$script:DotNetStackReportTimeoutSeconds = 45
$script:IntegrationTestHangHeartbeatIntervalSeconds = 8

function Write-IntegrationTestHangProgressHeartbeat {
    param(
        [Parameter(Mandatory)]
        [string]$Phase,

        [int]$ShardIndex = -1,

        [int]$ChunkNumber = -1,

        [int]$ProcessId = 0,

        [nullable[datetime]]$StartedUtc = $null,

        [nullable[datetime]]$DeadlineUtc = $null
    )

    $timestamp = Get-Date -Format 'HH:mm:ss'
    $details = @($Phase)

    if ($ShardIndex -ge 0 -and $ChunkNumber -ge 0) {
        $details += ("shard {0} chunk {1}" -f $ShardIndex, $ChunkNumber)
    }

    if ($ProcessId -gt 0) {
        $details += ("PID {0}" -f $ProcessId)
    }

    if ($null -ne $StartedUtc) {
        $elapsed = [datetime]::UtcNow - $StartedUtc

        if ($null -ne $DeadlineUtc) {
            $remaining = $DeadlineUtc - [datetime]::UtcNow

            if ($remaining.TotalSeconds -lt 0) {
                $remaining = [TimeSpan]::Zero
            }

            $details += (
                "elapsed {0:mm\:ss}, remaining {1:mm\:ss}" -f $elapsed, $remaining
            )
        }
        else {
            $details += ("elapsed {0:mm\:ss}" -f $elapsed)
        }
    }

    Write-Host ("STILL EXECUTING... {0} ({1})" -f $timestamp, ($details -join ', '))
}

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

function Test-LinuxCiRunner {
    return $IsLinux -or [bool]$env:GITHUB_ACTIONS
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

        if (Test-LinuxCiRunner) {
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

    return [int[]]@($visited)
}

function Get-LinuxProcessCommandLine {
    param(
        [Parameter(Mandatory)]
        [int]$ProcessId
    )

    $cmdlinePath = "/proc/$ProcessId/cmdline"

    if (-not (Test-Path -LiteralPath $cmdlinePath)) {
        return $null
    }

    try {
        $rawBytes = [System.IO.File]::ReadAllBytes($cmdlinePath)

        if ($null -eq $rawBytes -or $rawBytes.Length -eq 0) {
            return $null
        }

        $text = [System.Text.Encoding]::UTF8.GetString($rawBytes).Replace([char]0, ' ').Trim()

        if ([string]::IsNullOrWhiteSpace($text)) {
            return $null
        }

        return $text
    }
    catch {
        return $null
    }
}

function Get-WindowsProcessCommandLine {
    param(
        [Parameter(Mandatory)]
        [int]$ProcessId
    )

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue

    if ($null -eq $process) {
        return $null
    }

    return $process.CommandLine
}

function Get-ProcessCommandLine {
    param(
        [Parameter(Mandatory)]
        [int]$ProcessId
    )

    if ($IsLinux -or [bool]$env:GITHUB_ACTIONS) {
        return Get-LinuxProcessCommandLine -ProcessId $ProcessId
    }

    return Get-WindowsProcessCommandLine -ProcessId $ProcessId
}

function Get-ProcessNameSafe {
    param(
        [Parameter(Mandatory)]
        [int]$ProcessId
    )

    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue

    if ($null -eq $process) {
        return '(exited)'
    }

    return $process.ProcessName
}

function Write-ChunkProcessTreeDiagnostics {
    param(
        [Parameter(Mandatory)]
        [int]$RootProcessId,

        [Parameter(Mandatory)]
        [int]$CurrentProcessId
    )

    $descendantIds = @(Get-DescendantProcessIds -RootProcessId $RootProcessId)
    Write-Host ("Chunk process tree diagnostics: root PID {0}, {1} descendant(s)" -f $RootProcessId, $descendantIds.Count)

    foreach ($processId in ($descendantIds | Sort-Object)) {
        if ($processId -eq $CurrentProcessId) {
            continue
        }

        $processName = Get-ProcessNameSafe -ProcessId $processId
        $commandLine = Get-ProcessCommandLine -ProcessId $processId

        if ($null -eq $commandLine) {
            Write-Host ("  PID {0} name={1} cmdline=(unavailable)" -f $processId, $processName)
            continue
        }

        $preview = $commandLine

        if ($preview.Length -gt 240) {
            $preview = $preview.Substring(0, 240) + '...'
        }

        Write-Host ("  PID {0} name={1} cmdline={2}" -f $processId, $processName, $preview)
    }
}

function Test-IntegrationTestHangDumpPrimaryTargetCommandLine {
    param(
        [Parameter(Mandatory)]
        [string]$CommandLine
    )

    return $CommandLine -match '(?i)(/|\\)testhost\.dll\b'
}

function Test-IntegrationTestHangDumpSecondaryTargetCommandLine {
    param(
        [Parameter(Mandatory)]
        [string]$CommandLine
    )

    if ($CommandLine -match '(?i)dotnet\s+test\s+') {
        return $false
    }

    if ($CommandLine -match '(?i)datacollector') {
        return $false
    }

    return $CommandLine -match '(?i)vstest\.console|Microsoft\.TestPlatform|/testhost\.dll'
}

function Test-IntegrationTestDumpTargetCommandLine {
    param(
        [Parameter(Mandatory)]
        [string]$CommandLine
    )

    return (Test-IntegrationTestHangDumpPrimaryTargetCommandLine -CommandLine $CommandLine) `
        -or (Test-IntegrationTestHangDumpSecondaryTargetCommandLine -CommandLine $CommandLine)
}

function Get-IntegrationTestDumpTargetProcessIds {
    param(
        [Parameter(Mandatory)]
        [int]$RootProcessId,

        [Parameter(Mandatory)]
        [int]$CurrentProcessId
    )

    Write-ChunkProcessTreeDiagnostics -RootProcessId $RootProcessId -CurrentProcessId $CurrentProcessId

    $descendantIds = @(Get-DescendantProcessIds -RootProcessId $RootProcessId)
    $primaryTargetIds = [System.Collections.Generic.List[int]]::new()
    $secondaryTargetIds = [System.Collections.Generic.List[int]]::new()
    $dotnetDescendantIds = [System.Collections.Generic.List[int]]::new()
    $directChildDotnetIds = [System.Collections.Generic.List[int]]::new()

    foreach ($processId in $descendantIds) {
        if ($processId -eq $CurrentProcessId) {
            continue
        }

        $processName = Get-ProcessNameSafe -ProcessId $processId
        $commandLine = Get-ProcessCommandLine -ProcessId $processId

        if ($processName -eq 'dotnet') {
            [void]$dotnetDescendantIds.Add($processId)
        }

        if ($null -eq $commandLine) {
            continue
        }

        if (Test-IntegrationTestHangDumpPrimaryTargetCommandLine -CommandLine $commandLine) {
            Write-Host ("Selected dump target PID {0} (testhost primary match)" -f $processId)
            [void]$primaryTargetIds.Add($processId)
            continue
        }

        if (Test-IntegrationTestHangDumpSecondaryTargetCommandLine -CommandLine $commandLine) {
            Write-Host ("Selected dump target PID {0} (secondary vstest match)" -f $processId)
            [void]$secondaryTargetIds.Add($processId)
        }
    }

    if ($primaryTargetIds.Count -gt 0) {
        $bestPrimaryTargetId = @($primaryTargetIds | Sort-Object -Descending)[0]

        return [int[]]@($bestPrimaryTargetId)
    }

    if ($secondaryTargetIds.Count -gt 0) {
        $bestSecondaryTargetId = @($secondaryTargetIds | Sort-Object -Descending)[0]

        return [int[]]@($bestSecondaryTargetId)
    }

    if ($IsLinux -or [bool]$env:GITHUB_ACTIONS) {
        $childOutput = & pgrep -P $RootProcessId 2>$null

        if ($null -ne $childOutput) {
            foreach ($childLine in @($childOutput)) {
                $childText = $childLine.ToString().Trim()

                if ($childText -notmatch '^\d+$') {
                    continue
                }

                $childProcessId = [int]$childText
                $childName = Get-ProcessNameSafe -ProcessId $childProcessId

                if ($childName -eq 'dotnet') {
                    Write-Host ("Selected dump target PID {0} (fallback: direct dotnet child of root {1})" -f $childProcessId, $RootProcessId)
                    [void]$directChildDotnetIds.Add($childProcessId)
                }
            }
        }
    }

    if ($directChildDotnetIds.Count -gt 0) {
        return [int[]]@($directChildDotnetIds | Select-Object -Unique)
    }

    if ($dotnetDescendantIds.Count -gt 0) {
        Write-Host ("No cmdline-matched dump targets; falling back to {0} dotnet descendant(s)" -f $dotnetDescendantIds.Count)

        return [int[]]@($dotnetDescendantIds | Select-Object -Unique)
    }

    return @()
}

function Resolve-DotNetGlobalToolExecutablePath {
    param(
        [Parameter(Mandatory)]
        [string]$ToolName
    )

    # Prefer a single Application command; Get-Command without -CommandType can return multiple infos
    # and .Source becomes a string[] that fails [string] parameters in Start-Job argument lists.
    $applicationCommand = Get-Command -Name $ToolName -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($null -ne $applicationCommand -and -not [string]::IsNullOrWhiteSpace($applicationCommand.Source)) {
        return [string]$applicationCommand.Source
    }

    $homeDirectory = if ($null -ne $env:HOME -and $env:HOME.Length -gt 0) { $env:HOME } else { $env:USERPROFILE }
    $defaultPath = Join-Path $homeDirectory (".dotnet/tools/$ToolName")

    if ((Test-LinuxCiRunner) -and (Test-Path -LiteralPath $defaultPath)) {
        return [string]$defaultPath
    }

    $windowsPath = "$defaultPath.exe"

    if (-not (Test-LinuxCiRunner) -and (Test-Path -LiteralPath $windowsPath)) {
        return [string]$windowsPath
    }

    return $null
}

function Get-DotNetDumpExecutablePath {
    return Resolve-DotNetGlobalToolExecutablePath -ToolName 'dotnet-dump'
}

function Write-DotNetGlobalToolInstallTranscript {
    param(
        [AllowNull()]
        [object]$Output
    )

    if ($null -eq $Output) {
        return
    }

    foreach ($line in @($Output)) {
        if ($null -ne $line) {
            Write-Host $line.ToString()
        }
    }
}

function Install-DotNetGlobalTool {
    param(
        [Parameter(Mandatory)]
        [string]$ToolName,

        [Parameter(Mandatory)]
        [string]$Version
    )

    # dotnet tool install writes to the success stream; if that leaks from Ensure-* callers,
    # PowerShell binds [string] parameters to object[] and dump capture fails on CI.
    $installOutput = & dotnet tool install -g $ToolName --version $Version 2>&1
    Write-DotNetGlobalToolInstallTranscript -Output $installOutput

    if ($LASTEXITCODE -ne 0) {
        throw ("dotnet tool install -g {0} failed with exit code {1}." -f $ToolName, $LASTEXITCODE)
    }
}

function ConvertTo-DotNetGlobalToolPath {
    param(
        [Parameter(Mandatory)]
        [AllowNull()]
        [object]$ResolvedPath,

        [Parameter(Mandatory)]
        [string]$ToolName
    )

    if ($ResolvedPath -is [System.Array]) {
        $ResolvedPath = $ResolvedPath[-1]
    }

    $pathText = [string]$ResolvedPath

    if ([string]::IsNullOrWhiteSpace($pathText)) {
        throw ("{0} path could not be resolved to a non-empty string." -f $ToolName)
    }

    return $pathText
}

function Ensure-DotNetDumpTool {
    $existingPath = Get-DotNetDumpExecutablePath

    if ($null -ne $existingPath) {
        Write-Host ("dotnet-dump already available at {0}" -f $existingPath)
        return (ConvertTo-DotNetGlobalToolPath -ResolvedPath $existingPath -ToolName 'dotnet-dump')
    }

    Write-Host ("Installing dotnet-dump global tool (version {0}) ..." -f $script:DotNetDumpToolVersion)
    Install-DotNetGlobalTool -ToolName 'dotnet-dump' -Version $script:DotNetDumpToolVersion

    $installedPath = Get-DotNetDumpExecutablePath

    if ($null -eq $installedPath) {
        throw 'dotnet-dump was installed but could not be resolved on PATH.'
    }

    Write-Host ("dotnet-dump installed at {0}" -f $installedPath)
    return (ConvertTo-DotNetGlobalToolPath -ResolvedPath $installedPath -ToolName 'dotnet-dump')
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
    } -ArgumentList ([string]$DotNetDumpPath), $ProcessId, ([string]$OutputPath)

    $deadline = [datetime]::UtcNow.AddSeconds($TimeoutSeconds)
    $startedUtc = [datetime]::UtcNow
    $heartbeatIntervalSeconds = $script:IntegrationTestHangHeartbeatIntervalSeconds
    $nextHeartbeatUtc = $startedUtc

    try {
        while ($collectJob.State -eq 'Running') {
            if ([datetime]::UtcNow -ge $deadline) {
                Write-Host ("dotnet-dump collect timed out after {0}s for PID {1}" -f $TimeoutSeconds, $ProcessId)
                Stop-Job -Job $collectJob -Force -ErrorAction SilentlyContinue
                return $false
            }

            if ([datetime]::UtcNow -ge $nextHeartbeatUtc) {
                Write-IntegrationTestHangProgressHeartbeat `
                    -Phase 'dotnet-dump collect' `
                    -ProcessId $ProcessId `
                    -StartedUtc $startedUtc `
                    -DeadlineUtc $deadline

                $nextHeartbeatUtc = [datetime]::UtcNow.AddSeconds($heartbeatIntervalSeconds)
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

function Get-DotNetStackExecutablePath {
    return Resolve-DotNetGlobalToolExecutablePath -ToolName 'dotnet-stack'
}

function Ensure-DotNetStackTool {
    $existingPath = Get-DotNetStackExecutablePath

    if ($null -ne $existingPath) {
        Write-Host ("dotnet-stack already available at {0}" -f $existingPath)
        return (ConvertTo-DotNetGlobalToolPath -ResolvedPath $existingPath -ToolName 'dotnet-stack')
    }

    Write-Host ("Installing dotnet-stack global tool (version {0}) ..." -f $script:DotNetStackToolVersion)
    Install-DotNetGlobalTool -ToolName 'dotnet-stack' -Version $script:DotNetStackToolVersion

    $installedPath = Get-DotNetStackExecutablePath

    if ($null -eq $installedPath) {
        throw 'dotnet-stack was installed but could not be resolved on PATH.'
    }

    Write-Host ("dotnet-stack installed at {0}" -f $installedPath)
    return (ConvertTo-DotNetGlobalToolPath -ResolvedPath $installedPath -ToolName 'dotnet-stack')
}

function Invoke-DotNetStackReportBounded {
    param(
        [Parameter(Mandatory)]
        [string]$DotNetStackPath,

        [Parameter(Mandatory)]
        [int]$ProcessId,

        [Parameter(Mandatory)]
        [string]$OutputPath,

        [int]$TimeoutSeconds = $script:DotNetStackReportTimeoutSeconds
    )

    $reportJob = Start-Job -ScriptBlock {
        param($ToolPath, $TargetProcessId, $ReportPath)
        Set-StrictMode -Version Latest
        & $ToolPath report -p $TargetProcessId | Out-File -LiteralPath $ReportPath -Encoding utf8
        exit $LASTEXITCODE
    } -ArgumentList ([string]$DotNetStackPath), $ProcessId, ([string]$OutputPath)

    $deadline = [datetime]::UtcNow.AddSeconds($TimeoutSeconds)
    $startedUtc = [datetime]::UtcNow
    $heartbeatIntervalSeconds = $script:IntegrationTestHangHeartbeatIntervalSeconds
    $nextHeartbeatUtc = $startedUtc

    try {
        while ($reportJob.State -eq 'Running') {
            if ([datetime]::UtcNow -ge $deadline) {
                Write-Host ("dotnet-stack report timed out after {0}s for PID {1}" -f $TimeoutSeconds, $ProcessId)
                Stop-Job -Job $reportJob -Force -ErrorAction SilentlyContinue
                return $false
            }

            if ([datetime]::UtcNow -ge $nextHeartbeatUtc) {
                Write-IntegrationTestHangProgressHeartbeat `
                    -Phase 'dotnet-stack report' `
                    -ProcessId $ProcessId `
                    -StartedUtc $startedUtc `
                    -DeadlineUtc $deadline

                $nextHeartbeatUtc = [datetime]::UtcNow.AddSeconds($heartbeatIntervalSeconds)
            }

            Start-Sleep -Seconds 2
        }

        $output = Receive-Job -Job $reportJob -Wait -AutoRemoveJob -ErrorAction SilentlyContinue

        if ($null -ne $output) {
            $output | ForEach-Object { Write-Host $_ }
        }

        if ($reportJob.ChildJobs[0].JobStateInfo.State -eq 'Failed') {
            $reason = $reportJob.ChildJobs[0].JobStateInfo.Reason

            if ($null -ne $reason) {
                Write-Host ("dotnet-stack report failed for PID {0}: {1}" -f $ProcessId, $reason.Message)
            }

            return $false
        }

        return (Test-Path -LiteralPath $OutputPath)
    }
    finally {
        if ($reportJob.State -eq 'Running') {
            Stop-Job -Job $reportJob -Force -ErrorAction SilentlyContinue
            Remove-Job -Job $reportJob -Force -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-IntegrationTestHangStackReportCapture {
    param(
        [Parameter(Mandatory)]
        [string]$DotNetStackPath,

        [Parameter(Mandatory)]
        [int]$ProcessId,

        [Parameter(Mandatory)]
        [int]$ShardIndex,

        [Parameter(Mandatory)]
        [int]$ChunkNumber,

        [Parameter(Mandatory)]
        [string]$ResultsDirectory
    )

    $stackReportPath = Join-Path $ResultsDirectory (
        "dotnet-stack-shard-{0}-chunk{1}-{2}.txt" -f $ShardIndex, $ChunkNumber, $ProcessId
    )

    Write-Host ("Capturing dotnet-stack report for PID {0} -> {1}" -f $ProcessId, $stackReportPath)

    try {
        $captured = Invoke-DotNetStackReportBounded `
            -DotNetStackPath $DotNetStackPath `
            -ProcessId $ProcessId `
            -OutputPath $stackReportPath

        if (-not $captured) {
            Write-Host ("dotnet-stack report did not produce a file for PID {0}" -f $ProcessId)
        }
    }
    catch {
        Write-Host ("dotnet-stack report failed for PID {0}: {1}" -f $ProcessId, $_.Exception.Message)
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

    $dotnetDumpPath = ConvertTo-DotNetGlobalToolPath -ResolvedPath (Ensure-DotNetDumpTool) -ToolName 'dotnet-dump'
    $dotnetStackPath = ConvertTo-DotNetGlobalToolPath -ResolvedPath (Ensure-DotNetStackTool) -ToolName 'dotnet-stack'

    try {
        $targetProcessIds = @(
            Get-IntegrationTestDumpTargetProcessIds `
                -RootProcessId $RootProcessId `
                -CurrentProcessId $PID)

        if ($targetProcessIds.Count -eq 0) {
            Write-Host 'No dump target processes found in the chunk process tree; skipping dump/stack capture.'
            return
        }

        foreach ($targetProcessId in $targetProcessIds) {
            $dumpPath = Join-Path $ResultsDirectory (
                "hangdump-shard-{0}-chunk{1}-{2}.dmp" -f $ShardIndex, $ChunkNumber, $targetProcessId
            )

            Write-Host ("Capturing out-of-process dump for PID {0} -> {1}" -f $targetProcessId, $dumpPath)

            $capturedDump = $false

            try {
                $capturedDump = Invoke-DotNetDumpCollectBounded `
                    -DotNetDumpPath $dotnetDumpPath `
                    -ProcessId $targetProcessId `
                    -OutputPath $dumpPath

                if (-not $capturedDump) {
                    Write-Host ("Dump capture did not produce a file for PID {0}" -f $targetProcessId)
                }
            }
            catch {
                Write-Host ("Dump capture failed for PID {0}: {1}" -f $targetProcessId, $_.Exception.Message)
            }

            if (-not $capturedDump) {
                Invoke-IntegrationTestHangStackReportCapture `
                    -DotNetStackPath $dotnetStackPath `
                    -ProcessId $targetProcessId `
                    -ShardIndex $ShardIndex `
                    -ChunkNumber $ChunkNumber `
                    -ResultsDirectory $ResultsDirectory
            }
            else {
                # Always capture dotnet-stack alongside the dump so human-readable thread stacks are
                # available in CI without needing to download and load the .dmp binary locally.
                Invoke-IntegrationTestHangStackReportCapture `
                    -DotNetStackPath $dotnetStackPath `
                    -ProcessId $targetProcessId `
                    -ShardIndex $ShardIndex `
                    -ChunkNumber $ChunkNumber `
                    -ResultsDirectory $ResultsDirectory
            }
        }
    }
    catch {
        Write-Host ("Hang dump/stack capture failed: {0}" -f $_.Exception.Message)
        Write-Host $_.ScriptStackTrace
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

    $descendantIds = @(Get-DescendantProcessIds -RootProcessId $RootProcess.Id)

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
        # treats "Code" and "Coverage" as extra project paths (MSB1008). Integration shards use
        # test.runsettings (no Coverlet) to avoid collector crashes during chunked SQL runs.
        '--results-directory', $ResultsDirectory,
        '--logger', 'console;verbosity=minimal',
        '--logger', "trx;LogFilePrefix=full-core-api-integration-shard-$ShardIndex-chunk$ChunkNumber-",
        '--diag', $DiagLogPath
        # Do NOT pass --blame-hang here: the in-process collector keeps testhost alive after failures and
        # wedges vstest in TcpClientExtensions.MessageLoopAsync until the parent chunk watchdog fires.
        # Out-of-process dumps are captured in Invoke-IntegrationTestHangDumpCapture instead.
    )

    $process = Start-Process `
        -FilePath 'dotnet' `
        -ArgumentList $argumentList `
        -PassThru `
        -NoNewWindow `
        -RedirectStandardOutput $stdoutLogPath `
        -RedirectStandardError $stderrLogPath

    $deadline = [datetime]::UtcNow.Add($ChunkTimeout)
    $startedUtc = [datetime]::UtcNow
    $timedOut = $false
    $heartbeatIntervalSeconds = $script:IntegrationTestHangHeartbeatIntervalSeconds
    $heartbeatCount = 0

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

        $heartbeatCount += 1

        Write-IntegrationTestHangProgressHeartbeat `
            -Phase 'dotnet test chunk' `
            -ShardIndex $ShardIndex `
            -ChunkNumber $ChunkNumber `
            -ProcessId $process.Id `
            -StartedUtc $startedUtc `
            -DeadlineUtc $deadline

        if ($heartbeatCount % 4 -eq 0) {
            Write-ChunkRedirectLogTail `
                -Label 'dotnet test chunk stdout (recent)' `
                -LogPath $stdoutLogPath `
                -TailLineCount 8
        }

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
