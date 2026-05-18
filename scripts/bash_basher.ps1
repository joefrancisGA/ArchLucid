# Terminates wsl.exe and bash.exe on a 15-minute loop. Keep this window open.
#
# Usage (repo root):
#   pwsh scripts/bash_basher.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$intervalMinutes = 15
$intervalSeconds = $intervalMinutes * 60
$processNames = @('wsl', 'bash')

Write-Host "bash_basher started. Interval: $intervalMinutes minutes. Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) {

    foreach ($name in $processNames) {
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

    Write-Host ''
    Write-Host 'DO NOT CLOSE.  THIS IS THE CLEANER!!!' -ForegroundColor Yellow
    Write-Host "Waiting $intervalMinutes minutes (next run ~$((Get-Date).AddMinutes($intervalMinutes).ToString('yyyy-MM-dd HH:mm:ss')))."
    Write-Host ''

    Start-Sleep -Seconds $intervalSeconds
}
