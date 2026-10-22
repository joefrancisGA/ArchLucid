<#
.SYNOPSIS
  Conditionally deallocates an ArchLucid Windows development VM when idle (Azure Automation).
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-IdleLog {
  param([string] $Message)
  Write-Output ("[{0:u}] {1}" -f (Get-Date).ToUniversalTime(), $Message)
}

function Get-RequiredAutomationVariable {
  param([string] $Name)
  $value = Get-AutomationVariable -Name $Name
  if ($null -eq $value) { throw "Automation variable '$Name' is missing or null." }
  return $value
}

function Get-VmPowerStateCode {
  param($VmWithStatus)
  $statuses = @($VmWithStatus.Statuses)
  if ($statuses.Count -eq 0 -and $null -ne $VmWithStatus.InstanceView) {
    $statuses = @($VmWithStatus.InstanceView.Statuses)
  }
  $power = $statuses | Where-Object { $_.Code -like 'PowerState/*' } | Select-Object -First 1
  if ($null -eq $power) { return 'PowerState/unknown' }
  return [string] $power.Code
}

function Get-AverageCpuPercent {
  param([string] $ResourceId, [datetime] $StartTime, [datetime] $EndTime)
  $metric = Get-AzMetric -ResourceId $ResourceId -MetricName 'Percentage CPU' -TimeGrain ([TimeSpan]::FromMinutes(5)) -StartTime $StartTime -EndTime $EndTime -AggregationType Average -WarningAction SilentlyContinue
  $points = @($metric.Data | Where-Object { $null -ne $_.Average })
  if ($points.Count -eq 0) { return $null }
  return [double](($points | Measure-Object -Property Average -Average).Average)
}

function Get-NetworkByteTotal {
  param([string] $ResourceId, [datetime] $StartTime, [datetime] $EndTime)
  $sum = [double]0
  foreach ($name in @('Network In Total', 'Network Out Total')) {
    $metric = Get-AzMetric -ResourceId $ResourceId -MetricName $name -TimeGrain ([TimeSpan]::FromMinutes(5)) -StartTime $StartTime -EndTime $EndTime -AggregationType Total -WarningAction SilentlyContinue
    $points = @($metric.Data | Where-Object { $null -ne $_.Total })
    if ($points.Count -eq 0) { return $null }
    $sum += [double](($points | Measure-Object -Property Total -Sum).Sum)
  }
  return $sum
}

function New-GuestIdleCheckScript {
  param([string] $KeepAlivePath, [string] $ProtectedProcessNamesCsv)
  $script = @'
$ErrorActionPreference = "Stop"
$keepAlivePath = "__KEEPALIVE_PATH__"
$protectedNames = @(__PROTECTED_NAMES__)
function Test-HasActiveInteractiveSession {
  $raw = & quser 2>&1 | Out-String
  if ($raw -match "No User exists") { return $false }
  foreach ($line in ($raw -split "`r?`n")) {
    if ($line -match "USERNAME") { continue }
    if ($line -match "\sActive\s") { return $true }
  }
  return $false
}
$hasActiveSession = Test-HasActiveInteractiveSession
$hasKeepAlive = Test-Path -LiteralPath $keepAlivePath
$runningProtected = @()
foreach ($name in $protectedNames) {
  if ([string]::IsNullOrWhiteSpace($name)) { continue }
  if (@(Get-Process -Name $name -ErrorAction SilentlyContinue).Count -gt 0) { $runningProtected += $name }
}
$reasons = @()
if ($hasActiveSession) { $reasons += "active_rdp_session" }
if ($hasKeepAlive) { $reasons += "keepalive_file" }
if ($runningProtected.Count -gt 0) { $reasons += ("protected_processes:" + ($runningProtected -join ",")) }
([ordered]@{
  hasActiveSession = $hasActiveSession
  hasKeepAliveFile = $hasKeepAlive
  protectedProcesses = @($runningProtected)
  shouldStayUp = ($reasons.Count -gt 0)
  reasons = @($reasons)
}) | ConvertTo-Json -Compress
'@
  $quotedNames = @(
    $ProtectedProcessNamesCsv.Split(',') |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_.Length -gt 0 } |
      ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }
  )
  $namesLiteral = if ($quotedNames.Count -eq 0) { '' } else { $quotedNames -join ',' }
  $script = $script.Replace('__KEEPALIVE_PATH__', ($KeepAlivePath -replace "'", "''"))
  $script = $script.Replace('__PROTECTED_NAMES__', $namesLiteral)
  return $script
}

function Invoke-GuestIdleCheck {
  param([string] $ResourceGroupName, [string] $VmName, [string] $KeepAlivePath, [string] $ProtectedProcessNamesCsv)
  $guestScript = New-GuestIdleCheckScript -KeepAlivePath $KeepAlivePath -ProtectedProcessNamesCsv $ProtectedProcessNamesCsv
  $run = Invoke-AzVMRunCommand -ResourceGroupName $ResourceGroupName -Name $VmName -CommandId 'RunPowerShellScript' -ScriptString $guestScript
  $stdout = ($run.Value | Where-Object { $_.Code -like '*StdOut*' } | Select-Object -First 1).Message
  if ([string]::IsNullOrWhiteSpace($stdout)) { throw 'Guest idle check returned empty stdout.' }
  $jsonLine = ($stdout -split "`r?`n" | Where-Object { $_.Trim().StartsWith('{') } | Select-Object -Last 1)
  if ([string]::IsNullOrWhiteSpace($jsonLine)) { throw "Guest idle check stdout lacked JSON: $stdout" }
  return ($jsonLine | ConvertFrom-Json)
}

$resourceGroupName = [string](Get-RequiredAutomationVariable -Name 'TargetVmResourceGroup')
$vmName = [string](Get-RequiredAutomationVariable -Name 'TargetVmName')
$keepAlivePath = [string](Get-RequiredAutomationVariable -Name 'KeepAlivePath')
$protectedCsv = [string](Get-RequiredAutomationVariable -Name 'ProtectedProcessNames')
$lookbackMinutes = [int](Get-RequiredAutomationVariable -Name 'IdleLookbackMinutes')
$cpuThreshold = [double](Get-RequiredAutomationVariable -Name 'CpuThresholdPercent')
$networkThreshold = [double](Get-RequiredAutomationVariable -Name 'NetworkThresholdBytes')
$dryRun = [bool](Get-RequiredAutomationVariable -Name 'DryRun')

Write-IdleLog "Starting idle evaluate for VM '$vmName' in '$resourceGroupName' (dryRun=$dryRun)."
Connect-AzAccount -Identity | Out-Null

$vm = Get-AzVM -ResourceGroupName $resourceGroupName -Name $vmName -Status
$powerState = Get-VmPowerStateCode -VmWithStatus $vm
Write-IdleLog "Power state: $powerState"
if ($powerState -ne 'PowerState/running') {
  Write-IdleLog 'VM is not running; nothing to deallocate.'
  return
}

$endTime = (Get-Date).ToUniversalTime()
$startTime = $endTime.AddMinutes(-1 * $lookbackMinutes)
$avgCpu = Get-AverageCpuPercent -ResourceId $vm.Id -StartTime $startTime -EndTime $endTime
$netBytes = Get-NetworkByteTotal -ResourceId $vm.Id -StartTime $startTime -EndTime $endTime
Write-IdleLog ("CPU average over {0}m: {1}" -f $lookbackMinutes, $(if ($null -eq $avgCpu) { 'n/a' } else { ('{0:N2}%' -f $avgCpu) }))
Write-IdleLog ("Network bytes over {0}m: {1}" -f $lookbackMinutes, $(if ($null -eq $netBytes) { 'n/a' } else { ('{0:N0}' -f $netBytes) }))

$guest = Invoke-GuestIdleCheck -ResourceGroupName $resourceGroupName -VmName $vmName -KeepAlivePath $keepAlivePath -ProtectedProcessNamesCsv $protectedCsv
Write-IdleLog ("Guest check: shouldStayUp={0}; reasons={1}" -f $guest.shouldStayUp, ((@($guest.reasons)) -join ';'))

$blockers = New-Object System.Collections.Generic.List[string]
if ($null -eq $avgCpu) { $blockers.Add('cpu_metrics_unavailable') }
elseif ($avgCpu -ge $cpuThreshold) { $blockers.Add(("cpu_avg_{0:N2}_ge_{1}" -f $avgCpu, $cpuThreshold)) }
if ($null -eq $netBytes) { $blockers.Add('network_metrics_unavailable') }
elseif ($netBytes -ge $networkThreshold) { $blockers.Add(("network_bytes_{0:N0}_ge_{1}" -f $netBytes, $networkThreshold)) }
if ([bool]$guest.shouldStayUp) { $blockers.Add('guest_idle_check_stay_up') }

if ($blockers.Count -gt 0) {
  Write-IdleLog ("Stay up. Blockers: {0}" -f ($blockers -join '; '))
  return
}

if ($dryRun) {
  Write-IdleLog 'DryRun=true: would deallocate now, but Stop-AzVM was skipped.'
  return
}

Write-IdleLog 'Idle conditions met. Deallocating VM (Stop-AzVM without -StayProvisioned).'
Stop-AzVM -ResourceGroupName $resourceGroupName -Name $vmName -Force
Write-IdleLog 'Stop-AzVM completed.'
