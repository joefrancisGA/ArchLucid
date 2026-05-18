# Trims wsl/bash (keep 10 newest), dotnet (keep 5 newest), PowerShell hosts (keep 10), conhost (keep 20);
# reports other exes with >3 instances. Never terminates a process younger than 3 minutes.
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
$maxPowerShellInstances = 10
$maxConhostInstances = 20
$minProcessAgeMinutes = 3
$powerShellProcessNames = @('powershell', 'pwsh')
$reportExcludeNames = @('wsl', 'bash', 'dotnet', 'powershell', 'pwsh', 'conhost')
$reportMinInstances = 3

function Stop-ExcessProcesses {
    param(
        [string[]] $Names,
        [int] $KeepCount,
        [int] $MinAgeMinutes = $minProcessAgeMinutes
    )

    $processes = @(
        foreach ($name in $Names) {
            Get-Process -Name $name -ErrorAction SilentlyContinue
        }
    )

    $processes = @($processes | Sort-Object Id -Unique)

    if ($processes.Count -le $KeepCount) {
        return
    }

    $label = ($Names -join ', ')
    $excessCount = $processes.Count - $KeepCount
    $minStartTime = (Get-Date).AddMinutes(-$MinAgeMinutes)
    $candidates = @(
        $processes |
            Sort-Object StartTime, Id |
            Select-Object -First $excessCount
    )
    $toTerminate = @(
        $candidates |
            Where-Object { $_.StartTime -and $_.StartTime -le $minStartTime }
    )
    $skippedYoung = $candidates.Count - $toTerminate.Count
    $terminatedCount = 0

    foreach ($proc in $toTerminate) {

        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            $terminatedCount++
            Write-Host "Terminated $($proc.ProcessName).exe (PID $($proc.Id), started $($proc.StartTime))."
        }
        catch {
            Write-Warning "Failed to terminate $($proc.ProcessName).exe (PID $($proc.Id)): $($_.Exception.Message)"
        }
    }

    $summary = "${label}: kept $KeepCount newest of $($processes.Count); terminated $terminatedCount."

    if ($skippedYoung -gt 0) {
        $summary += " Skipped $skippedYoung excess younger than $MinAgeMinutes minute(s)."
    }

    Write-Host $summary
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

    Stop-ExcessProcesses -Names @('wsl') -KeepCount $maxWslInstances
    Stop-ExcessProcesses -Names @('bash') -KeepCount $maxBashInstances
    Stop-ExcessProcesses -Names @('dotnet') -KeepCount $maxDotnetInstances
    Stop-ExcessProcesses -Names $powerShellProcessNames -KeepCount $maxPowerShellInstances
    Stop-ExcessProcesses -Names @('conhost') -KeepCount $maxConhostInstances

    Write-HighInstanceProcessReport -MoreThanInstanceCount $reportMinInstances -ExcludeNames $reportExcludeNames

    Write-Host ''
    Write-Host 'DO NOT CLOSE.  THIS IS THE CLEANER!!!' -ForegroundColor Yellow
    Write-Host "Waiting $intervalMinutes minutes (next run ~$((Get-Date).AddMinutes($intervalMinutes).ToString('yyyy-MM-dd HH:mm:ss')))."
    Write-Host ''

    Start-Sleep -Seconds $intervalSeconds
}
