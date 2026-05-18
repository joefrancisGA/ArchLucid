# Trims wsl/bash (keep 10 newest), dotnet (keep 5 newest); reports other exes with >3 instances.
# Keep this window open.
#
# Usage (repo root):
#   pwsh scripts/bash_basher.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$intervalMinutes = 15
$intervalSeconds = $intervalMinutes * 60
$maxWslInstances = 10
$maxBashInstances = 10
$maxDotnetInstances = 5
$reportExcludeNames = @('wsl', 'bash', 'dotnet')
$reportMinInstances = 3

function Stop-ExcessProcesses {
    param(
        [string] $Name,
        [int] $KeepCount
    )

    $processes = @(Get-Process -Name $Name -ErrorAction SilentlyContinue)

    if ($processes.Count -le $KeepCount) {
        return
    }

    $excessCount = $processes.Count - $KeepCount
    $toTerminate = @(
        $processes |
            Sort-Object StartTime, Id |
            Select-Object -First $excessCount
    )

    foreach ($proc in $toTerminate) {

        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "Terminated $Name.exe (PID $($proc.Id), started $($proc.StartTime))."
        }
        catch {
            Write-Warning "Failed to terminate $Name.exe (PID $($proc.Id)): $($_.Exception.Message)"
        }
    }

    Write-Host "$Name.exe: kept $KeepCount newest of $($processes.Count); terminated $excessCount."
}

function Write-HighInstanceProcessReport {
    param(
        [int] $MoreThanInstanceCount,
        [string[]] $ExcludeNames
    )

    $excludeSet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

    foreach ($excludeName in $ExcludeNames) {
        [void]$excludeSet.Add($excludeName)
    }

    $groups = @(
        Get-Process -ErrorAction SilentlyContinue |
            Group-Object -Property Name |
            Where-Object { $_.Count -gt $MoreThanInstanceCount -and -not $excludeSet.Contains($_.Name) } |
            Sort-Object -Property Count
    )

    Write-Host ''

    if ($groups.Count -eq 0) {
        Write-Host "No processes with more than $MoreThanInstanceCount running instances (excluding $($ExcludeNames -join ', '))."
        return
    }

    Write-Host "Processes with more than $MoreThanInstanceCount running instances:"

    foreach ($group in $groups) {
        Write-Host "$($group.Name) ($($group.Count))"
    }
}

Write-Host "bash_basher started. Interval: $intervalMinutes minutes. Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) {

    Stop-ExcessProcesses -Name 'wsl' -KeepCount $maxWslInstances
    Stop-ExcessProcesses -Name 'bash' -KeepCount $maxBashInstances
    Stop-ExcessProcesses -Name 'dotnet' -KeepCount $maxDotnetInstances

    Write-HighInstanceProcessReport -MoreThanInstanceCount $reportMinInstances -ExcludeNames $reportExcludeNames

    Write-Host ''
    Write-Host 'DO NOT CLOSE.  THIS IS THE CLEANER!!!' -ForegroundColor Yellow
    Write-Host "Waiting $intervalMinutes minutes (next run ~$((Get-Date).AddMinutes($intervalMinutes).ToString('yyyy-MM-dd HH:mm:ss')))."
    Write-Host ''

    Start-Sleep -Seconds $intervalSeconds
}
