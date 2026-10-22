<#
.SYNOPSIS
  Local idle evaluator for this ArchLucid Windows development VM.

.DESCRIPTION
  Runs on the guest every 15 minutes (Scheduled Task). Deallocates via Azure CLI
  only after consecutive idle observations cover IdleMinutesRequired (default 45).

  Prefer this on-box loop for RDP/process/keepalive accuracy; Azure Automation can
  still be applied later as a cloud-side backup.
#>
[CmdletBinding()]
param(
  [string] $ResourceGroupName = 'rg-ArchLucid-dev-cus',
  [string] $VmName = 'vm-win-cus-01',
  [string] $SubscriptionId = '8aa56f3b-18bc-43ca-ad45-bad9e811d33b',
  [string] $KeepAlivePath = 'C:\AzureVM\DO-NOT-SHUTDOWN',
  [string] $StatePath = 'C:\AzureVM\idle-deallocate-state.json',
  [string] $LogPath = 'C:\AzureVM\idle-deallocate.log',
  [int] $IdleMinutesRequired = 45,
  [int] $CheckIntervalMinutes = 15,
  [double] $CpuThresholdPercent = 5,
  [string[]] $ProtectedProcessNames = @(
    'MSBuild', 'dotnet', 'npm', 'node', 'git', 'docker', 'docker-compose',
    'com.docker.backend', 'dockerd'
  ),
  [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-IdleLocalLog {
  param([string] $Message)

  $line = '[{0:u}] {1}' -f (Get-Date).ToUniversalTime(), $Message
  Write-Output $line

  $dir = Split-Path -Parent $LogPath

  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  Add-Content -LiteralPath $LogPath -Value $line -Encoding utf8
}

function Test-HasActiveInteractiveSession {
  $raw = & quser 2>&1 | Out-String

  if ($raw -match 'No User exists') {
    return $false
  }

  $lines = $raw -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }

  foreach ($line in $lines) {
    if ($line -match 'USERNAME') {
      continue
    }

    if ($line -match '\sActive\s') {
      return $true
    }
  }

  return $false
}

function Get-RecentCpuAveragePercent {
  # Sample ~20 seconds of \Processor(_Total)\% Processor Time for a local signal.
  $samples = Get-Counter -Counter '\Processor(_Total)\% Processor Time' -SampleInterval 2 -MaxSamples 10
  $values = @($samples.CounterSamples | ForEach-Object { [double]$_.CookedValue })

  if ($values.Count -eq 0) {
    return $null
  }

  return [double](($values | Measure-Object -Average).Average)
}

function Get-RunningProtectedProcesses {
  param([string[]] $Names)

  $running = New-Object System.Collections.Generic.List[string]

  foreach ($name in $Names) {
    if ([string]::IsNullOrWhiteSpace($name)) {
      continue
    }

    $procs = @(Get-Process -Name $name -ErrorAction SilentlyContinue)

    if ($procs.Count -gt 0) {
      $running.Add($name)
    }
  }

  return @($running)
}

function Read-IdleState {
  if (-not (Test-Path -LiteralPath $StatePath)) {
    return [pscustomobject]@{
      firstIdleUtc = $null
      lastIdleUtc  = $null
      lastBusyUtc  = $null
      lastReason   = $null
    }
  }

  return (Get-Content -LiteralPath $StatePath -Raw -Encoding utf8 | ConvertFrom-Json)
}

function Write-IdleState {
  param($State)

  $dir = Split-Path -Parent $StatePath

  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  ($State | ConvertTo-Json -Compress) | Set-Content -LiteralPath $StatePath -Encoding utf8
}

function Invoke-AzDeallocate {
  param(
    [string] $ResourceGroupName,
    [string] $VmName,
    [string] $SubscriptionId
  )

  $az = Get-Command az -ErrorAction SilentlyContinue

  if ($null -eq $az) {
    throw 'Azure CLI (az) not found on PATH. Install Microsoft.AzureCLI and sign in.'
  }

  & az account set --subscription $SubscriptionId | Out-Null

  if ($LASTEXITCODE -ne 0) {
    throw "az account set failed (exit $LASTEXITCODE). Run az login for this subscription."
  }

  & az vm deallocate --resource-group $ResourceGroupName --name $VmName --output none

  if ($LASTEXITCODE -ne 0) {
    throw "az vm deallocate failed (exit $LASTEXITCODE)."
  }
}

# --- main --------------------------------------------------------------------

$dryRunEffective = $DryRun.IsPresent
$dryRunFlagPath = 'C:\AzureVM\DRY-RUN'

if (Test-Path -LiteralPath $dryRunFlagPath) {
  $dryRunEffective = $true
}

Write-IdleLocalLog "Local idle check starting (dryRun=$dryRunEffective)."

$blockers = New-Object System.Collections.Generic.List[string]

if (Test-Path -LiteralPath $KeepAlivePath) {
  $blockers.Add('keepalive_file')
}

if (Test-HasActiveInteractiveSession) {
  $blockers.Add('active_rdp_session')
}

$protected = Get-RunningProtectedProcesses -Names $ProtectedProcessNames

if ($protected.Count -gt 0) {
  $blockers.Add('protected_processes:' + ($protected -join ','))
}

$cpu = Get-RecentCpuAveragePercent

if ($null -eq $cpu) {
  $blockers.Add('cpu_sample_unavailable')
}
elseif ($cpu -ge $CpuThresholdPercent) {
  $blockers.Add(('cpu_avg_{0:N2}_ge_{1}' -f $cpu, $CpuThresholdPercent))
}

$nowUtc = (Get-Date).ToUniversalTime()
$state = Read-IdleState

if ($blockers.Count -gt 0) {
  $state.firstIdleUtc = $null
  $state.lastBusyUtc = $nowUtc.ToString('o')
  $state.lastReason = ($blockers -join ';')
  Write-IdleState -State $state
  Write-IdleLocalLog ("Stay up. Blockers: {0}" -f ($blockers -join '; '))
  exit 0
}

if ([string]::IsNullOrWhiteSpace([string]$state.firstIdleUtc)) {
  $state.firstIdleUtc = $nowUtc.ToString('o')
}

$state.lastIdleUtc = $nowUtc.ToString('o')
$state.lastReason = 'idle_observation'
Write-IdleState -State $state

$firstIdle = [datetime]::Parse([string]$state.firstIdleUtc, $null, [System.Globalization.DateTimeStyles]::RoundtripKind)
$idleForMinutes = ($nowUtc - $firstIdle.ToUniversalTime()).TotalMinutes

Write-IdleLocalLog ("Idle streak: {0:N1} minutes (need {1}). CPU sample={2:N2}%." -f $idleForMinutes, $IdleMinutesRequired, $cpu)

if ($idleForMinutes -lt $IdleMinutesRequired) {
  Write-IdleLocalLog 'Idle but lookback not satisfied yet.'
  exit 0
}

if ($dryRunEffective) {
  Write-IdleLocalLog 'DryRun: would deallocate now via az vm deallocate.'
  exit 0
}

Write-IdleLocalLog "Deallocating $VmName in $ResourceGroupName..."
Invoke-AzDeallocate -ResourceGroupName $ResourceGroupName -VmName $VmName -SubscriptionId $SubscriptionId
Write-IdleLocalLog 'az vm deallocate completed.'
exit 0
