<#
    .SYNOPSIS
        Stops stale dotnet testhost / vstest processes that hold locks on
        ArchLucid.Api.Tests output binaries, preventing subsequent test builds.

    .DESCRIPTION
        Pre-test hygiene helper — terminates only processes whose command-line
        references the ArchLucid.Api.Tests bin or obj output directories.
        It never kills unrelated developer processes.

        Dot-source or call-script from targeted test workflows before invoking
        `dotnet test` on any tier that compiles ArchLucid.Api.Tests.

    .PARAMETER SelfTest
        Instead of performing cleanup, asserts that no stale qualifying processes
        currently exist. Exits 0 on pass, 1 if stale processes are found.
        Useful as a no-op guard in scripts and CI smoke gates.

    .EXAMPLE
        # Normal pre-test cleanup
        .\scripts\Stop-DotnetTestProcesses.ps1

        # Assert no stale processes exist (no-op probe)
        .\scripts\Stop-DotnetTestProcesses.ps1 -SelfTest
#>
[CmdletBinding()]
param(
    [switch] $SelfTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Patterns matched against each process's full command-line string.
# Both the project directory name and the built DLL name are included so the
# filter catches testhost processes launched with either form.
$targetPatterns = @(
    'ArchLucid.Api.Tests',
    'ArchLucid.Api.dll'
)

function Get-StaleTestProcesses {
    # WMI provides the full command-line, which is what we need to distinguish
    # which dotnet / testhost instance is locking the Api.Tests output directory.
    [System.Diagnostics.Process[]] $candidates = Get-Process `
        -Name 'dotnet', 'testhost', 'vstest.console' `
        -ErrorAction SilentlyContinue

    [System.Collections.Generic.List[System.Diagnostics.Process]] $stale =
        [System.Collections.Generic.List[System.Diagnostics.Process]]::new()

    foreach ($proc in $candidates) {
        [string] $cmdLine = ''

        try {
            [Microsoft.Management.Infrastructure.CimInstance] $wmi =
                Get-CimInstance Win32_Process `
                    -Filter "ProcessId = $($proc.Id)" `
                    -ErrorAction SilentlyContinue

            if ($null -ne $wmi -and $null -ne $wmi.CommandLine) {
                $cmdLine = $wmi.CommandLine
            }
        }
        catch {
            # CIM access can fail for system-level processes; treat as non-matching.
        }

        foreach ($pattern in $targetPatterns) {
            if ($cmdLine -like "*$pattern*") {
                $stale.Add($proc)
                break
            }
        }
    }

    return , $stale.ToArray()
}

[System.Diagnostics.Process[]] $staleProcesses = Get-StaleTestProcesses

if ($SelfTest) {
    if ($staleProcesses.Count -eq 0) {
        Write-Host '[Stop-DotnetTestProcesses] Self-test PASS: no stale ArchLucid.Api.Tests processes found.' `
            -ForegroundColor Green
        exit 0
    }

    Write-Host "[Stop-DotnetTestProcesses] Self-test FAIL: $($staleProcesses.Count) stale process(es) found:" `
        -ForegroundColor Red

    foreach ($proc in $staleProcesses) {
        Write-Host "  PID $($proc.Id)  Name: $($proc.ProcessName)" -ForegroundColor Yellow
    }

    exit 1
}

if ($staleProcesses.Count -eq 0) {
    Write-Host '[Stop-DotnetTestProcesses] No stale ArchLucid.Api.Tests processes found - nothing to clean up.' `
        -ForegroundColor Green
    exit 0
}

Write-Host "[Stop-DotnetTestProcesses] Stopping $($staleProcesses.Count) stale process(es) locking ArchLucid.Api.Tests output:" `
    -ForegroundColor Yellow

foreach ($proc in $staleProcesses) {
    Write-Host "  PID $($proc.Id)  Name: $($proc.ProcessName)" -ForegroundColor Yellow

    try {
        $proc.Kill()

        # Give the process up to 5 s to exit before continuing.
        [bool] $exited = $proc.WaitForExit(5000)

        if ($exited) {
            Write-Host "  PID $($proc.Id) stopped cleanly." -ForegroundColor Green
        }
        else {
            Write-Host "  PID $($proc.Id) did not exit within 5 s - may require manual action." -ForegroundColor DarkYellow
        }
    }
    catch {
        Write-Host "  PID $($proc.Id) could not be stopped: $_" -ForegroundColor DarkYellow
    }
}

Write-Host '[Stop-DotnetTestProcesses] Cleanup complete.' -ForegroundColor Green
exit 0
