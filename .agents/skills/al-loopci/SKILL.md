---
name: al-loopci
description: >-
  Dispatch full CI on a named git branch, poll every 10 minutes, fix any
  unsuccessful run (failure, timed_out, cancelled, or other non-success), bump
  timed-out job timeouts by 5 minutes, push, and re-dispatch until green. Use
  when the user invokes /al-loopci <branch>, asks to loop CI on RC10/RC11/master,
  or wants automated CI fix-and-retry monitoring on a release branch.
disable-model-invocation: true
---

# /al-loopci — CI dispatch, monitor, fix, retry

Drive **full CI** (`ci.yml` via `workflow_dispatch`) on a branch until the latest run is **green**. Poll every **10 minutes**. On **any unsuccessful completed run** (not only `failure`): diagnose, fix, push, re-dispatch, and **keep looping** — do not stop after a single failed cycle.

**Unsuccessful** means `status == completed` and `conclusion != success`. That includes `failure`, `timed_out`, `canceled`, `action_required`, `startup_failure`, and any other non-success conclusion. Do **not** treat only `failure` as actionable.

## Invoke

```
/al-loopci <branch>
```

| Input | Required | Example |
|-------|----------|---------|
| `branch` | yes | `RC11`, `RC10`, `master` |

If the branch is omitted, reply with usage and stop.

## Repo layout

| Path | Use |
|------|-----|
| `C:\ArchLucid\ArchLucid` | Default repo root (`master`, feature branches) |
| `C:\ArchLucid\ArchLucid-<BRANCH>` | Release worktree when it exists (e.g. `ArchLucid-RC11` for `RC11`) |

**Checkout rule:** edit and push from the worktree whose branch matches `<branch>`. If no worktree exists, `git switch <branch>` in the main repo (create local tracking branch if needed).

## Loop architecture

Combine the **`loop` skill** dynamic schedule with this workflow:

1. **Run once immediately** (dispatch + first status check).
2. **Arm a 10-minute wake** at the end of each turn (one background sleeper per active loop):

```powershell
$branch = '<branch>'
Start-Sleep -Seconds 600
Write-Host ('AGENT_LOOP_WAKE_CI {0}' -f (@{ branch = $branch; action = 'check-status' } | ConvertTo-Json -Compress))
```

Use `notify_on_output` with pattern `^AGENT_LOOP_WAKE_CI` and title `Loop every 10m: /al-loopci $branch`.

3. **On wake**, read the JSON payload, execute the check/fix cycle below, then re-arm the next 10-minute sleeper unless the user asked to stop or CI is green.
4. **Do not** start duplicate sleepers or duplicate fixed `while ($true)` monitors for the same branch.

**Stop conditions:** user says stop, or latest CI run `conclusion == success` for a run whose `headSha` matches the branch tip after your fixes.

## Phase 1 — Bootstrap (first turn)

From repo root:

```powershell
# Verify branch exists on origin
gh api "repos/{owner}/{repo}/branches/<branch>" --jq '.name'

# Dispatch full CI (required for release branches without open PR)
gh workflow run ci.yml --ref <branch>

Start-Sleep -Seconds 8
.\scripts\agent\al-loopci-check.ps1 -Branch '<branch>'
```

Log start to `.local/ci-watch-<branch>.log` (create `.local/` if missing).

Tell the user: branch, dispatched run URL, poll interval (10m), and that fix-and-retry continues until green.

## Phase 2 — Status check (every wake)

```powershell
.\scripts\agent\al-loopci-check.ps1 -Branch '<branch>'
```

| `status` | `conclusion` | Action |
|----------|--------------|--------|
| `queued` / `in_progress` | — | Brief progress note; re-arm 10m sleeper |
| `completed` | `success` | Log green, summarize, **stop loop** |
| `completed` | **anything other than `success`** (including `failure`, `timed_out`, `canceled`, …) | → Phase 3 |
| `completed` | empty / null | Treat as unsuccessful → Phase 3 |

Always track `databaseId`, `headSha`, `url`, and `needsTriage` from the script output. If `needsTriage` is true, enter Phase 3 even when you are unsure of the conclusion string.

**Cancelled supersede:** If `conclusion == canceled` **and** a newer `ci.yml` run on the same branch tip is already `queued` / `in_progress` / `success`, skip Phase 3 fixes, note the cancel, and re-arm (or stop if the newer run is green). Otherwise treat cancel like any other unsuccessful outcome → Phase 3.

## Phase 3 — Unsuccessful-run triage

One shell invocation per turn when possible. Collect **all** non-success jobs — not only `failure`:

```powershell
$runId = '<databaseId>'
gh api "repos/{owner}/{repo}/actions/runs/$runId/jobs?per_page=100" |
  Out-File -FilePath ".local/ci-watch-<branch>-jobs.json" -Encoding utf8

# PowerShell: list every job that did not succeed/skip
$jobs = (Get-Content ".local/ci-watch-<branch>-jobs.json" -Raw | ConvertFrom-Json).jobs
$jobs |
  Where-Object { $_.conclusion -notin @('success', 'skipped', 'neutral') -and $_.conclusion } |
  ForEach-Object { '{0} | {1}' -f $_.name, $_.conclusion }

gh run view $runId --log-failed 2>&1 |
  Out-File -FilePath ".local/ci-watch-<branch>-failed.log" -Encoding utf8
```

Also pull logs for `timed_out` jobs if `--log-failed` omits them (download job logs via `gh api` / `gh run view --job <id> --log`).

**Triage rules:**

1. Cluster by **root cause** (one bad file often cascades across UI jobs).
2. Prefer **minimal scoped fixes** on `<branch>` only.
3. Follow repo rules: `shell-hygiene.mdc`, `Agent-Working-Tree-Safety.mdc`, `Git-Commit-Requires-Branch.mdc` (branch is `<branch>` from invoke).
4. **Do not** weaken CI workflows to pass — except the **explicit +5 minute timeout bump** below for jobs that actually timed out.
5. **Do not** change unrelated code; merge/rebase base branch only when failures are clearly from drift.

### Job timed out → bump timeout by 5 minutes

If **any** job has `conclusion == timed_out`, or failed logs show the GitHub Actions job/step wall-clock timeout (`The job running on runner ... has exceeded the maximum execution time`, `The operation was canceled` after hitting `timeout-minutes`):

1. Identify the matching job (and matrix shard if any) in `.github/workflows/ci.yml` by job `name:` / `timeout-minutes` / `matrix.step_timeout_minutes`.
2. **Add five minutes** to that job’s `timeout-minutes` (e.g. `45` → `50`).
3. If the timeout was on a **step** that uses `timeout-minutes: ${{ matrix.step_timeout_minutes }}` (or similar), bump the relevant matrix `step_timeout_minutes` by **5** as well.
4. Commit the bump with other fixes (or alone if timeout was the only issue).
5. Do **not** bump timeouts for jobs that failed for non-timeout reasons.
6. Do **not** remove or disable the timeout.

Record bumped jobs in the user update and in `.local/ci-watch-<branch>.log`.

### Common ArchLucid failure patterns

| Symptom | Typical fix |
|---------|-------------|
| Turbopack duplicate export / parse error | Fix merge damage in cited `.tsx`; align with `master` |
| `ArchLucidApiClient.g.cs` out of sync | Regenerate NSwag client or sync from `master` |
| `api-types.generated.ts` drift | Regenerate from OpenAPI snapshot |
| Terraform `azurerm_*` unsupported | Bump provider in `.terraform.lock.hcl` for cited stack |
| ESLint `buyer-review-terminology` | Replace banned copy with "architecture review" / "architecture package" (not legacy "review package") |
| Live Playwright flakes | Harden waits in `archlucid-ui/e2e/helpers/` (condition-based, no hard-coded IDs) |
| `dotnet-fast-core-build:skipped` | Usually cascade; fix earlier blocking job |
| Job `conclusion: timed_out` | Bump that job’s `timeout-minutes` (and matrix step timeout if applicable) by **+5**, fix any real errors in the same logs, push, re-dispatch |

### Scoped local verify (optional, before push)

Use **one** scoped compile when .NET changed:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

UI-only: `npm run lint` or targeted Vitest in `archlucid-ui` when cheap.

## Phase 4 — Fix, push, re-dispatch

Always re-dispatch after an unsuccessful run once triage is done — even if the only change was a timeout bump, and even if cancel had no code fix but no newer run covers the tip.

```powershell
# From the <branch> worktree or checkout
.\scripts\agent\check-working-tree-path.ps1 -Path '<paths-you-will-edit>'

git add <scoped-paths>
git commit -m "fix(ci): <concise root-cause summary for <branch>"
git push origin <branch>

gh workflow run ci.yml --ref <branch>
```

If the only change is a timeout bump:

```text
fix(ci): add 5m to <job-name> timeout on <branch>
```

Append to `.local/ci-watch-<branch>.log`: commit SHA, new run id after dispatch, list of timeout bumps.

→ Return to **Phase 2** on the next 10-minute wake (or check once immediately after push if the user is waiting).

## Commit and push discipline

- Stage **only** paths changed for the CI fix (including `ci.yml` timeout bumps).
- Never `git add -A` on a dirty tree.
- User must not need to name the branch again — it is `<branch>` from `/al-loopci`.
- Cherry-pick from `master` to release branches when the fix already landed on `master` and the release branch lacks it.

## User updates

On each wake, keep updates short:

- Run URL, status, elapsed time if useful
- On unsuccessful: root-cause clusters **and** any `timed_out` jobs (with +5m bump note)
- On fix: what changed, new commit, new run URL
- On green: final SHA and run URL

## Guardrails

- **CI workflow:** `ci.yml` only unless the user explicitly names another workflow.
- **Poll interval:** 10 minutes — do not poll faster unless the user overrides.
- **Indefinite retry:** keep the loop through multiple unsuccessful cycles; only stop on green or user stop.
- **Shell:** at most one `Shell` tool call per agent turn; chain `git` inspection in that call.
- **No speculative full builds** unless a fix requires it.
- **Timeout bumps:** only +5 minutes per unsuccessful cycle per timed-out job/step; do not leap by larger amounts unless the user overrides.

## Related

- `loop` skill — wake/sentinel mechanics
- `babysit` skill — PR comment + CI loop (PR-scoped)
- `docs/TEST_EXECUTION_MODEL.md` — CI tier map
- `.cursor/skills/al-ui-tableupdate/SKILL.md` — project skill conventions
