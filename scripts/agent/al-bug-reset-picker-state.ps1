#Requires -Version 5.1
<#
.SYNOPSIS
  Archive set run logs and reset zone picker metadata (option A) without wiping hunt diaries.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidateRange(1, 4)]
    [int[]] $Set = @(1, 2, 3, 4),
    [string] $ArchiveStamp,
    [switch] $DryRun
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$scriptDir = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$zoneSetScript = Join-Path $scriptDir 'al-bug-zone-set.ps1'
$runLogUtilsScript = Join-Path $scriptDir 'al-bug-run-log-utils.ps1'
if (-not (Test-Path -LiteralPath $zoneSetScript)) { throw "Missing zone set helper." }
if (-not (Test-Path -LiteralPath $runLogUtilsScript)) { throw "Missing run log helper." }
. $zoneSetScript
. $runLogUtilsScript
if ([string]::IsNullOrWhiteSpace($ArchiveStamp)) { $ArchiveStamp = (Get-Date).ToString('yyyy-MM-dd') }
$archiveDir = Join-Path $repoRoot 'docs\library\archive'
function Reset-LedgerPickerMetadata { param([string] $LedgerPath)
    $text = [IO.File]::ReadAllText($LedgerPath)
    $text = [regex]::Replace($text, '(?m)^- \*\*status:\*\* (cooling|exhausted)\s*$', '- **status:** open')
    $text = [regex]::Replace($text, '(?m)^- \*\*hunts:\*\* \d+\s*$', '- **hunts:** 0')
    $text = [regex]::Replace($text, '(?m)^- \*\*bugs-found:\*\* \d+\s*$', '- **bugs-found:** 0')
    $text = [regex]::Replace($text, '(?m)^- \*\*consecutive-dry-hunts:\*\* \d+\s*$', '- **consecutive-dry-hunts:** 0')
    $text = [regex]::Replace($text, '(?m)^- \*\*last-hunt:\*\* .*$', '- **last-hunt:** never')
    $text = [regex]::Replace($text, '(?m)^- \*\*last-bug:\*\* .*$', '- **last-bug:** never')
    $text = [regex]::Replace($text, '(?m)^- \*\*related-pd-tb:\*\* .*$', '- **related-pd-tb:** none')
    $text = [regex]::Replace($text, '(?m)^- \*\*code-changed-since:\*\* .*$', '- **code-changed-since:** yes')
    return $text
}
function New-ResetRunLogBootstrapLine { param([int] $SetId)
    $at = (Get-Date).ToUniversalTime().ToString('o')
    return (@{ at = $at; zoneId = '_picker_reset'; outcome = 'reset'; set = $SetId; note = "option A picker metadata reset; archive stamp $ArchiveStamp" } | ConvertTo-Json -Compress)
}
foreach ($setId in @($Set | Sort-Object -Unique)) {
    $zoneSet = Get-AlBugZoneSet -Id $setId -RepoRoot $repoRoot
    $ledgerPath = Join-Path $repoRoot ($zoneSet.ledger -replace '/', [IO.Path]::DirectorySeparatorChar)
    $runLogPath = Join-Path $repoRoot ($zoneSet.runLog -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $ledgerPath)) { throw "Ledger not found for set $setId" }
    $archiveName = "AL_BUG_HUNT_RUN_LOG_{0}_{1}.jsonl" -f $setId, $ArchiveStamp
    $archivePath = Join-Path $archiveDir $archiveName
    Write-Host ("Set {0}: {1}" -f $setId, $zoneSet.runLog)
    if ($DryRun) { continue }
    if (-not (Test-Path -LiteralPath $archiveDir)) { New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null }
    if (Test-Path -LiteralPath $runLogPath) {
        if (Test-Path -LiteralPath $archivePath) { throw "Archive already exists: $archivePath" }
        Move-Item -LiteralPath $runLogPath -Destination $archivePath
    }
    $bootstrap = New-ResetRunLogBootstrapLine -SetId $setId
    [IO.File]::WriteAllText($runLogPath, ($bootstrap + [Environment]::NewLine), (New-Object System.Text.UTF8Encoding $false))
    [IO.File]::WriteAllText($ledgerPath, (Reset-LedgerPickerMetadata -LedgerPath $ledgerPath))
}
if ($DryRun) { Write-Host 'DryRun complete.' } else { Write-Host 'Picker reset complete.' }