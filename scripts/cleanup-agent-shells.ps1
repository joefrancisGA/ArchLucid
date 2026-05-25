# Stop orphaned Cursor agent PowerShell wrappers (not integrated IDE terminals).
#
# Usage:
#   .\scripts\cleanup-agent-shells.ps1           # list matches, then prompt to stop
#   .\scripts\cleanup-agent-shells.ps1 -DryRun   # list only
#   .\scripts\cleanup-agent-shells.ps1 -Force    # stop without prompting

param(
    [switch] $DryRun,
    [switch] $Force
)

$ErrorActionPreference = 'Stop'

function Test-AgentShellProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ProcessName,

        [AllowNull()]
        [string] $CommandLine
    )

    if ([string]::IsNullOrWhiteSpace($CommandLine)) {
        return $false
    }

    # Integrated Cursor / VS Code terminal tabs stay open with -noexit.
    if ($CommandLine -match '-noexit\s+-command') {
        return $false
    }

    if ($ProcessName -eq 'powershell.exe' -and $CommandLine -match 'powershell(\.exe)?\s+-c\s') {
        return $true
    }

    if ($CommandLine -match 'ExecutionPolicy\s+Bypass\s+-File' -and $CommandLine -match 'cursor|Cursor|\.cursor') {
        return $true
    }

    return $false
}

function Get-AgentShellProcesses {
    $selfPid = $PID
    $candidates = Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'"

    return @(
        $candidates |
            Where-Object { $_.ProcessId -ne $selfPid } |
            Where-Object { Test-AgentShellProcess -ProcessName $_.Name -CommandLine $_.CommandLine } |
            ForEach-Object {
                [PSCustomObject]@{
                    ProcessId   = $_.ProcessId
                    Name        = $_.Name
                    ParentPid   = $_.ParentProcessId
                    AgeMinutes  = [math]::Round(((Get-Date) - $_.CreationDate).TotalMinutes, 1)
                    CommandLine = $_.CommandLine
                }
            }
    )
}

function Write-AgentShellTable {
    param(
        [Parameter(Mandatory = $true)]
        [object[]] $Processes
    )

    if ($Processes.Count -eq 0) {
        Write-Host 'No agent shell processes matched.' -ForegroundColor Green
        return
    }

    $Processes |
        Select-Object ProcessId, Name, ParentPid, AgeMinutes, @{
            Name = 'CommandPreview'
            Expression = {
                if ($null -eq $_.CommandLine) {
                    return '(none)'
                }

                $max = [Math]::Min(120, $_.CommandLine.Length)
                return $_.CommandLine.Substring(0, $max)
            }
        } |
        Format-Table -Wrap
}

$matches = @(Get-AgentShellProcesses)

Write-Host "Matched $($matches.Count) agent shell process(es)." -ForegroundColor Cyan
Write-AgentShellTable -Processes $matches

if ($matches.Count -eq 0) {
    exit 0
}

if ($DryRun) {
    Write-Host 'Dry run only; no processes stopped.' -ForegroundColor Yellow
    exit 0
}

if (-not $Force) {
    $answer = Read-Host 'Stop these processes? [y/N]'

    if ($answer -notmatch '^[yY]') {
        Write-Host 'Cancelled.' -ForegroundColor Yellow
        exit 0
    }
}

foreach ($proc in $matches) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped PID $($proc.ProcessId)" -ForegroundColor Green
}

$remaining = @(Get-AgentShellProcesses)
Write-Host "Remaining agent shells: $($remaining.Count)" -ForegroundColor Cyan
