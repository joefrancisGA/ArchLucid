# Terminates wsl.exe and bash.exe on a 15-minute loop; trims dotnet.exe when count > 5
# (oldest terminated first, five most recently started kept). Keep this window open.
#
# Usage (repo root):
#   pwsh scripts/bash_basher.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$intervalMinutes = 15
$intervalSeconds = $intervalMinutes * 60
$processNames = @('wsl', 'bash')
$maxDotnetInstances = 5

function Stop-NamedProcesses {
    param([string[]] $Names)

    foreach ($name in $Names) {
        $processes = @(Get-Process -Name $name -ErrorAction SilentlyContinue)

        foreach ($proc in $processes) {

            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction Stop
                Write-Host "Terminated $name.exe (PID $($proc.Id))."
            }
            catch {
                Write-Warning "Failed to terminate $name.exe (PID $($proc.Id)): $($_.Exception.Message)"
            }
        }
    }
}

function Stop-ExcessDotnetProcesses {
    param([int] $KeepCount)

    $dotnetProcesses = @(Get-Process -Name 'dotnet' -ErrorAction SilentlyContinue)

    if ($dotnetProcesses.Count -le $KeepCount) {
        return
    }

    $excessCount = $dotnetProcesses.Count - $KeepCount
    $toTerminate = @(
        $dotnetProcesses |
            Sort-Object StartTime, Id |
            Select-Object -First $excessCount
    )

    foreach ($proc in $toTerminate) {

        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "Terminated dotnet.exe (PID $($proc.Id), started $($proc.StartTime))."
        }
        catch {
            Write-Warning "Failed to terminate dotnet.exe (PID $($proc.Id)): $($_.Exception.Message)"
        }
    }

    Write-Host "dotnet.exe: kept $KeepCount newest of $($dotnetProcesses.Count); terminated $excessCount."
}

Write-Host "bash_basher started. Interval: $intervalMinutes minutes. Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) {

    Stop-NamedProcesses -Names $processNames
    Stop-ExcessDotnetProcesses -KeepCount $maxDotnetInstances

    Write-Host ''
    Write-Host 'DO NOT CLOSE.  THIS IS THE CLEANER!!!' -ForegroundColor Yellow
    Write-Host "Waiting $intervalMinutes minutes (next run ~$((Get-Date).AddMinutes($intervalMinutes).ToString('yyyy-MM-dd HH:mm:ss')))."
    Write-Host ''

    Start-Sleep -Seconds $intervalSeconds
}
