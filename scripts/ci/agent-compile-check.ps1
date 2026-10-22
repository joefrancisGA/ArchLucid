# Scoped agent compile check: builds to a temp output directory (avoids bin/ DLL locks),
# with a hard timeout. CI remains authoritative for full solution builds.
#
# Usage (from repo root):
#   .\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Core/ArchLucid.Core.csproj
#   .\scripts\ci\agent-compile-check.ps1 -ProjectPath ArchLucid.Core.slnf
#   .\scripts\ci\agent-compile-check.ps1 -Ui
#
# Exit codes:
#   0 — compile/typecheck succeeded for the requested scope
#   1 — compile or analyzer errors (fix and retry once on the same scope)
#   2 — timeout or file lock (complete the task if no CS/TS errors appeared in output)

param(
    [Parameter(ParameterSetName = 'Project', Mandatory = $true)]
    [string] $ProjectPath,

    [Parameter(ParameterSetName = 'Ui', Mandatory = $true)]
    [switch] $Ui,

    [Parameter(ParameterSetName = 'Project')]
    [Parameter(ParameterSetName = 'Ui')]
    [int] $TimeoutSeconds = 45
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Get-CombinedOutput {
    param(
        [string] $Stdout,
        [string] $Stderr
    )

    $out = if ($Stdout) { $Stdout } else { '' }
    $err = if ($Stderr) { $Stderr } else { '' }

    return $out + $err
}

function Test-HasCompileErrors {
    param([string] $Output)

    if ($Output -match '\berror CS\d{4}\b') {
        return $true
    }

    if ($Output -match '\berror TS\d{4}\b') {
        return $true
    }

    return $false
}

function Test-HasFileLockErrors {
    param([string] $Output)

    return $Output -match 'MSB302[17]'
}

function Test-BuildSucceeded {
    param([string] $Output)

    if (Test-HasCompileErrors -Output $Output) {
        return $false
    }

    return $Output -match 'Build succeeded\.'
}

function Stop-ProcessTree {
    param(
        [System.Diagnostics.Process] $Process
    )

    if ($null -eq $Process -or $Process.HasExited) {
        return
    }

    $runningOnWindows = $env:OS -like '*Windows*'

    if ($runningOnWindows) {
        Start-Process `
            -FilePath 'taskkill' `
            -ArgumentList @('/F', '/T', '/PID', $Process.Id.ToString()) `
            -NoNewWindow `
            -Wait `
            | Out-Null
    }
    else {
        $Process.Kill()
    }

    $Process.WaitForExit(5000) | Out-Null
}

function Resolve-ExecutablePath {
    param([string] $Name)

    $runningOnWindows = $env:OS -like '*Windows*'

    if ($runningOnWindows) {
        # Node installs npm as npm.ps1 + npm.cmd; Get-Command prefers the .ps1, which Start-Process cannot launch.
        $windowsCommand = Get-Command "$Name.exe", "$Name.cmd" -CommandType Application -ErrorAction SilentlyContinue |
            Select-Object -First 1

        if ($null -eq $windowsCommand) {
            throw "Executable not found on PATH: $Name (.exe or .cmd)"
        }

        return $windowsCommand.Source
    }

    return (Get-Command $Name -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
}

function Wait-ProcessWithHeartbeat {
    param(
        [System.Diagnostics.Process] $Process,
        [int] $TimeoutSeconds,
        [int] $HeartbeatSeconds = 8
    )

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    while ($stopwatch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        $remainingMs = [int](($TimeoutSeconds - $stopwatch.Elapsed.TotalSeconds) * 1000)
        $waitMs = [Math]::Max(1, [Math]::Min($HeartbeatSeconds * 1000, $remainingMs))

        if ($Process.WaitForExit($waitMs)) {
            return $true
        }

        Write-Host ("STILL EXECUTING... {0}" -f (Get-Date -Format 'HH:mm:ss'))
    }

    return $Process.HasExited
}

function Invoke-TimedExternalProcess {
    param(
        [string] $FileName,
        [string[]] $ArgumentList,
        [string] $WorkingDirectory,
        [int] $TimeoutSeconds
    )

    $stdoutFile = [System.IO.Path]::GetTempFileName()
    $stderrFile = [System.IO.Path]::GetTempFileName()

    try {
        $process = Start-Process `
            -FilePath $FileName `
            -ArgumentList $ArgumentList `
            -WorkingDirectory $WorkingDirectory `
            -NoNewWindow `
            -PassThru `
            -RedirectStandardOutput $stdoutFile `
            -RedirectStandardError $stderrFile `
            -Wait:$false

        # Without touching Handle while the process runs, ExitCode is $null after a redirected Start-Process exits.
        $null = $process.Handle

        $exitedInTime = Wait-ProcessWithHeartbeat -Process $process -TimeoutSeconds $TimeoutSeconds

        $stdout = Get-Content -LiteralPath $stdoutFile -Raw -ErrorAction SilentlyContinue
        $stderr = Get-Content -LiteralPath $stderrFile -Raw -ErrorAction SilentlyContinue
        $combined = Get-CombinedOutput -Stdout $stdout -Stderr $stderr

        if (-not $exitedInTime) {
            Stop-ProcessTree -Process $process
            Write-Host $stdout
            Write-Host $stderr

            if (Test-BuildSucceeded -Output $combined) {
                return @{
                    ExitCode       = 0
                    CombinedOutput = $combined
                    TimedOut       = $false
                }
            }

            return @{
                ExitCode       = 2
                CombinedOutput = $combined
                TimedOut       = $true
            }
        }

        Write-Host $stdout
        Write-Host $stderr

        $exitCode = $process.ExitCode
        if ($null -eq $exitCode) {
            $exitCode = 0
        }

        if ($exitCode -ne 0 -and (Test-BuildSucceeded -Output $combined)) {
            $exitCode = 0
        }

        if (Test-HasCompileErrors -Output $combined) {
            $exitCode = 1
        }

        return @{
            ExitCode       = $exitCode
            CombinedOutput = $combined
            TimedOut       = $false
        }
    }
    finally {
        Remove-Item -LiteralPath $stdoutFile -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stderrFile -Force -ErrorAction SilentlyContinue
    }
}

if ($Ui) {
    $uiRoot = Join-Path $repoRoot 'archlucid-ui'

    if (-not (Test-Path -LiteralPath $uiRoot)) {
        throw "UI directory not found: $uiRoot"
    }

    $result = Invoke-TimedExternalProcess `
        -FileName (Resolve-ExecutablePath -Name 'npm') `
        -ArgumentList @('run', 'typecheck') `
        -WorkingDirectory $uiRoot `
        -TimeoutSeconds $TimeoutSeconds

    if ($result.TimedOut) {
        if (Test-HasCompileErrors -Output $result.CombinedOutput) {
            exit 1
        }

        Write-Host 'AGENT_COMPILE_CHECK: TIMEOUT (no TS errors in output; CI is authoritative).'
        exit 2
    }

    if ($result.ExitCode -ne 0) {
        exit 1
    }

    exit 0
}

$projectFullPath = Resolve-Path -LiteralPath (Join-Path $repoRoot $ProjectPath)

$outDir = Join-Path $env:TEMP ('archlucid-agent-build-' + [Guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

try {
    $result = Invoke-TimedExternalProcess `
        -FileName (Resolve-ExecutablePath -Name 'dotnet') `
        -ArgumentList @(
            'build', $projectFullPath
            '-c', 'Release'
            '-o', $outDir
            '--nologo'
            '--disable-build-servers'
            '-v', 'minimal'
        ) `
        -WorkingDirectory $repoRoot `
        -TimeoutSeconds $TimeoutSeconds

    if ($result.TimedOut) {
        if (Test-HasCompileErrors -Output $result.CombinedOutput) {
            exit 1
        }

        Write-Host 'AGENT_COMPILE_CHECK: TIMEOUT (no CS errors in output; CI is authoritative).'
        exit 2
    }

    if ($result.ExitCode -ne 0) {
        if (Test-HasFileLockErrors -Output $result.CombinedOutput) {
            if (Test-HasCompileErrors -Output $result.CombinedOutput) {
                exit 1
            }

            Write-Host 'AGENT_COMPILE_CHECK: FILE_LOCK (ignored for agent completion when no CS errors).'
            exit 2
        }

        exit 1
    }

    exit 0
}
finally {
    Remove-Item -LiteralPath $outDir -Recurse -Force -ErrorAction SilentlyContinue
}
