#Requires -Version 5.1
<#
.SYNOPSIS
    Launch a Cursor Cloud Agent to run the /al-bug hunt-fix-ship workflow on master.

.DESCRIPTION
    -Loop launches hunts sequentially and waits for each run to finish before the next.
#>
[CmdletBinding()]
param(
    [string] $TargetBranch = 'master',
    [string] $Hint = '',
    [switch] $FindOnly,
    [switch] $Status,
    [switch] $Refresh,
    [string] $ImagePath,
    [switch] $Wait,
    [switch] $Loop,
    [int] $MaxHunts = 0,
    [int] $PollIntervalSeconds = 30,
    [switch] $StopOnError
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pickerScript = Join-Path $scriptRoot 'agent\al-bug-pick-zone.ps1'
$apiScript = Join-Path $scriptRoot 'Invoke-AlApi.ps1'
$waitScript = Join-Path $scriptRoot 'Wait-AlApiRun.ps1'

function Build-AlBugCloudPrompt {
    param(
        [string] $Branch,
        [string] $HuntHint,
        [bool] $IsFindOnly,
        [bool] $UseRefresh
    )

    $hintLine = if ($HuntHint -and $HuntHint.Trim().Length -gt 0) {
        "Hunt hint (pin zone): $($HuntHint.Trim())"
    }
    else {
        'Hunt hint: none (use picker output only).'
    }

    $modeLine = if ($IsFindOnly) {
        'RUN MODE: --find-only — complete Phase 1 only; do not fix, commit, or push.'
    }
    else {
        'RUN MODE: full hunt — find, fix, scoped verification, commit, and push to the target branch.'
    }

    $refreshLine = if ($UseRefresh) {
        'Picker: pass -Refresh to al-bug-pick-zone.ps1 when running the picker.'
    }
    else {
        'Picker: use default churn from the ledger (no -Refresh).'
    }

    $pickerHintArg = ''
    if ($HuntHint -and $HuntHint.Trim().Length -gt 0) {
        $pickerHintArg = " -Hint '$($HuntHint.Trim())'"
    }

    $pickerRefreshArg = if ($UseRefresh) { ' -Refresh' } else { '' }

    return @"
ArchLucid /al-bug cloud hunt

Read and follow .cursor/commands/al-bug.md end-to-end (Phases 0-4). This is the canonical workflow — do not substitute a shorter generic bug hunt.

$modeLine
Target branch: $Branch (push commits here; workOnCurrentBranch is enabled).
$hintLine
$refreshLine

Cloud environment (Linux VM):
1. Phase 0 — Run the deterministic zone picker before hunting:
   - Prefer: pwsh ./scripts/agent/al-bug-pick-zone.ps1 -Preview$pickerHintArg$pickerRefreshArg
   - Fallback: read docs/library/AL_BUG_HUNT_LEDGER.md and scripts/agent/al-bug-pick-zone.ps1 logic; hunt ONLY one picked zoneId.
2. Phase 1 — Repro-first: failing scoped test before any production fix. Use the picker testFilter with dotnet test.
3. Phase 2 — Minimal fix + permanent regression test. Scoped compile check when .NET production code changes.
4. Phase 3 — Ship scoped paths only to origin/${Branch}:
   - Prefer pwsh ./scripts/agent/al-bug-push-master.ps1 when available
   - Else: git add <scoped paths>; git commit; git push origin ${Branch}
5. Phase 4 — Update docs/library/AL_BUG_HUNT_LEDGER.md and docs/library/AL_BUG_HUNT_RUN_LOG.jsonl; record stats with al-bug-rolling-stats.ps1 when pwsh is available.

Run kind (announce immediately after the picker preview, before reading files):
- If picker seedHunt is true (or zone status is unseeded): say "This /al-bug run is a seed hunt" for the zone. Reseed hypotheses. Prove any newly hunt-ready row in this same run. If nothing is hunt-ready, stop as seed-only and keep Kind = seed hunt in the result table.
- Otherwise: say "This /al-bug run is a thorough defect hunt" for the zone. Complete cheap-disproof and failing-repro attempts. Do not exit after a file skim.

Queued /al-bug follow-ups do not shorten this run. Do not skip scoped tests, record seed-only on a thorough hunt, or invent another zone to reach the next queued command.

Guardrails:
- Hunt only the picker zone; no drive-by refactors.
- Stage only paths changed for this bug; never git add -A on a dirty tree.
- Do not open a PR (autoCreatePR is false).
- Finish with the /al-bug result markdown table from al-bug.md Phase 4. Kind (seed hunt / thorough hunt) is the first row.
"@
}

function Start-AlBugCloudHunt {
    param(
        [string] $Branch,
        [string] $HuntHint,
        [bool] $IsFindOnly,
        [bool] $UseRefresh,
        [string] $ScreenshotPath
    )

    $prompt = Build-AlBugCloudPrompt -Branch $Branch -HuntHint $HuntHint -IsFindOnly $IsFindOnly -UseRefresh $UseRefresh
    $apiArgs = @{
        Text = $prompt
        WorkOnCurrentBranch = $true
        StartingRef = $Branch
    }

    if ($ScreenshotPath -and $ScreenshotPath.Trim().Length -gt 0) {
        $apiArgs.ImagePath = $ScreenshotPath
    }

    return & $apiScript @apiArgs
}

function Wait-AlBugCloudRun {
    param(
        [string] $AgentId,
        [string] $RunId
    )

    return & $waitScript -AgentId $AgentId -RunId $RunId -PollIntervalSeconds $PollIntervalSeconds
}

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

if ($Loop) {
    $Wait = $true
}

if (-not $Wait) {
    return Start-AlBugCloudHunt -Branch $TargetBranch -HuntHint $Hint -IsFindOnly $FindOnly -UseRefresh $Refresh -ScreenshotPath $ImagePath
}

$huntNumber = 0
$lastResult = $null

while ($true) {
    if ($MaxHunts -gt 0 -and $huntNumber -ge $MaxHunts) {
        Write-Host "Reached MaxHunts ($MaxHunts). Stopping."
        break
    }

    $huntNumber++
    Write-Host ''
    Write-Host ("========== /al-bug-api hunt {0} ==========" -f $huntNumber)
    Write-Host ''

    $launch = Start-AlBugCloudHunt -Branch $TargetBranch -HuntHint $Hint -IsFindOnly $FindOnly -UseRefresh $Refresh -ScreenshotPath $ImagePath
    $lastResult = Wait-AlBugCloudRun -AgentId $launch.AgentId -RunId $launch.RunId

    Write-Host ("Hunt {0} ended with status {1}" -f $huntNumber, $lastResult.Status)

    if ($StopOnError -and $lastResult.Status -eq 'ERROR') {
        Write-Host 'StopOnError: halting loop.'
        break
    }

    if (-not $Loop) {
        return $lastResult
    }
}

return $lastResult
