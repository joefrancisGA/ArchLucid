<#
.SYNOPSIS
  Creates the DO-NOT-SHUTDOWN keepalive file on the development VM.

.DESCRIPTION
  Run on the Windows guest (elevated if the path needs it). While this file exists,
  the Azure Automation idle-deallocate runbook will not stop the VM.

.EXAMPLE
  .\Set-DevVmKeepAlive.ps1
  .\Set-DevVmKeepAlive.ps1 -Path 'C:\AzureVM\DO-NOT-SHUTDOWN' -Reason 'full solution test run'
#>
[CmdletBinding()]
param(
  [string] $Path = 'C:\AzureVM\DO-NOT-SHUTDOWN',
  [string] $Reason = 'manual keepalive'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dir = Split-Path -Parent $Path

if (-not (Test-Path -LiteralPath $dir)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$payload = @(
  "createdUtc=$((Get-Date).ToUniversalTime().ToString('o'))"
  "reason=$Reason"
  "user=$env:USERNAME"
  "machine=$env:COMPUTERNAME"
) -join "`r`n"

Set-Content -LiteralPath $Path -Value $payload -Encoding utf8
Write-Host "Keepalive set: $Path"
Write-Host "Delete with Clear-DevVmKeepAlive.ps1 when the long job finishes."
