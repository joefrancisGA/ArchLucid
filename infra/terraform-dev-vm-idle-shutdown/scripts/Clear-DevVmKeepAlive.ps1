<#
.SYNOPSIS
  Removes the DO-NOT-SHUTDOWN keepalive file on the development VM.

.EXAMPLE
  .\Clear-DevVmKeepAlive.ps1
#>
[CmdletBinding()]
param(
  [string] $Path = 'C:\AzureVM\DO-NOT-SHUTDOWN'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Host "Keepalive already absent: $Path"
  return
}

Remove-Item -LiteralPath $Path -Force
Write-Host "Keepalive cleared: $Path"
Write-Host "Idle automation may deallocate after the configured lookback if RDP/build signals are also quiet."
