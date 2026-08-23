#Requires -Version 5.1
<#
.SYNOPSIS
    Launch a Cursor Cloud Agent to run the /al-bug hunt-fix-ship workflow on master.

.DESCRIPTION
    Builds a self-contained cloud prompt from .cursor/commands/al-bug.md, then calls
    Invoke-AlApi.ps1 with workOnCurrentBranch=true so commits land on the target branch.

    --status runs the local zone picker preview only (no cloud agent).

.PARAMETER TargetBranch
    Git branch the cloud agent works on and pushes to. Default: master.

.PARAMETER Hint
    Optional hunt hint to pin a ledger zone (id or alias).

.PARAMETER FindOnly
    Cloud agent stops after Phase 1 (repro only; no fix/commit/push).

.PARAMETER Status
    Local-only: run al-bug-pick-zone.ps1 -Preview and exit.

.PARAMETER Refresh
    Pass -Refresh to the zone picker (local --status or embedded in cloud prompt).

.PARAMETER ImagePath
    Optional screenshot for the cloud agent prompt.
#>
[CmdletBinding()]
param(
    [string] $TargetBranch = 'master',

    [string] $Hint = '',

    [switch] $FindOnly,

    [switch] $Status,

    [switch] $Refresh,

    [string] $ImagePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pickerScript = Join-Path $scriptRoot 'agent\al-bug-pick-zone.ps1'
$apiScript = Join-Path $scriptRoot 'Invoke-AlApi.ps1'

if ($Status) {
    $pickerArgs = @('-Preview')

    if ($Hint -and $Hint.Trim().Length -gt 0) {
        $pickerArgs += @('-Hint', $Hint.Trim())
    }

    if ($Refresh) {
        $pickerArgs += @('-Refresh')
    }

    & $pickerScript @pickerArgs
    exit 0
}

$hintLine = if ($Hint -and $Hint.Trim().Length -gt 0) {
    "Hunt hint (pin zone): $($Hint.Trim())"
}
else {
    'Hunt hint: none (use picker output only).'
}

$modeLine = if ($FindOnly) {
    'RUN MODE: --find-only — complete Phase 1 only; do not fix, commit, or push.'
}
else {
    'RUN MODE: full hunt — find, fix, scoped verification, commit, and push to the target branch.'
}

$refreshLine = if ($Refresh) {
    'Picker: pass -Refresh to al-bug-pick-zone.ps1 when running the picker.'
}
else {
    'Picker: use default churn from the ledger (no -Refresh).'
}

$pickerHintArg = ''
if ($Hint -and $Hint.Trim().Length -gt 0) {
    $pickerHintArg = " -Hint '$($Hint.Trim())'"
}

$pickerRefreshArg = if ($Refresh) { ' -Refresh' } else { '' }

$prompt = @"
ArchLucid /al-bug cloud hunt

Read and follow .cursor/commands/al-bug.md end-to-end (Phases 0-4). This is the canonical workflow — do not substitute a shorter generic bug hunt.

$modeLine
Target branch: $TargetBranch (push commits here; workOnCurrentBranch is enabled).
$hintLine
$refreshLine

Cloud environment (Linux VM):
1. Phase 0 — Run the deterministic zone picker before hunting:
   - Prefer: pwsh ./scripts/agent/al-bug-pick-zone.ps1 -Preview$pickerHintArg$pickerRefreshArg
   - Fallback: read docs/library/AL_BUG_HUNT_LEDGER.md and scripts/agent/al-bug-pick-zone.ps1 logic; hunt ONLY one picked zoneId.
2. Phase 1 — Repro-first: failing scoped test before any production fix. Use the picker testFilter with dotnet test.
3. Phase 2 — Minimal fix + permanent regression test. Scoped compile check when .NET production code changes.
4. Phase 3 — Ship scoped paths only to origin/$TargetBranch:
   - Prefer pwsh ./scripts/agent/al-bug-push-master.ps1 when available
   - Else: git add <scoped paths>; git commit; git push origin $TargetBranch
5. Phase 4 — Update docs/library/AL_BUG_HUNT_LEDGER.md and docs/library/AL_BUG_HUNT_RUN_LOG.jsonl; record stats with al-bug-rolling-stats.ps1 when pwsh is available.

Guardrails:
- Hunt only the picker zone; no drive-by refactors.
- Stage only paths changed for this bug; never git add -A on a dirty tree.
- Do not open a PR (autoCreatePR is false).
- Finish with the /al-bug result markdown table from al-bug.md Phase 4.
"@

$apiArgs = @{
    Text = $prompt
    WorkOnCurrentBranch = $true
    StartingRef = $TargetBranch
}

if ($ImagePath -and $ImagePath.Trim().Length -gt 0) {
    $apiArgs.ImagePath = $ImagePath
}

& $apiScript @apiArgs
