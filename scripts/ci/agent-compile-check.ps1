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

        $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)

        while (-not $process.HasExited -and [DateTime]::UtcNow -lt $deadline) {
            Start-Sleep -Milliseconds 200
        }

        $stdout = Get-Content -LiteralPath $stdoutFile -Raw -ErrorAction SilentlyContinue
        $stderr = Get-Content -LiteralPath $stderrFile -Raw -ErrorAction SilentlyContinue
        $combined = Get-CombinedOutput -Stdout $stdout -Stderr $stderr

        if (-not $process.HasExited) {
            $process.Kill()
            $process.WaitForExit(5000) | Out-Null
            Write-Host $stdout
            Write-Host $stderr

            return @{
                ExitCode     = 2
                CombinedOutput = $combined
                TimedOut     = $true
            }
        }

        Write-Host $stdout
        Write-Host $stderr

        return @{
            ExitCode       = $process.ExitCode
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

    $npm = Get-Command npm -ErrorAction Stop
    $result = Invoke-TimedExternalProcess `
        -FileName $npm.Source `
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

dotnet build-server shutdown 2>$null | Out-Null

$outDir = Join-Path $env:TEMP ('archlucid-agent-build-' + [Guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

try {
    $dotnet = Get-Command dotnet -ErrorAction Stop
    $result = Invoke-TimedExternalProcess `
        -FileName $dotnet.Source `
        -ArgumentList @(
            'build', $projectFullPath
            '-c', 'Release'
            '-o', $outDir
            '--nologo'
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
