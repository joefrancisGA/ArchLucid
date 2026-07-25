---
name: al-loopci
description: >-
  Dispatch full CI on a named git branch, poll every 10 minutes, fix failures,
  push fixes, and re-dispatch until green. Use when the user invokes /al-loopci
  <branch>, asks to loop CI on RC10/RC11/master, or wants automated CI fix-and-retry
  monitoring on a release branch.
disable-model-invocation: true
---

# /al-loopci — CI dispatch, monitor, fix, retry

Drive **full CI** (`ci.yml` via `workflow_dispatch`) on a branch until the latest run is **green**. Poll every **10 minutes**. On failure: diagnose, fix, push, re-dispatch, and **keep looping** — do not stop after a single failed cycle.

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
| `completed` | `failure` / `cancelled` | → Phase 3 |
| `completed` | anything else | Treat as failure unless clearly benign |

Always track `databaseId`, `headSha`, and `url` from the script output.

## Phase 3 — Failure triage

One shell invocation per turn when possible:

```powershell
$runId = '<databaseId>'
gh run view $runId --json jobs --jq '.jobs[] | select(.conclusion=="failure") | .name'
gh run view $runId --log-failed 2>&1 | Out-File -FilePath ".local/ci-watch-<branch>-failed.log" -Encoding utf8
```

**Triage rules:**

1. Cluster failures by **root cause** (one bad file often cascades across UI jobs).
2. Prefer **minimal scoped fixes** on `<branch>` only.
3. Follow repo rules: `shell-hygiene.mdc`, `Agent-Working-Tree-Safety.mdc`, `Git-Commit-Requires-Branch.mdc` (branch is `<branch>` from invoke).
4. **Do not** weaken CI workflows to pass.
5. **Do not** change unrelated code; merge/rebase base branch only when failures are clearly from drift.

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

### Scoped local verify (optional, before push)

Use **one** scoped compile when .NET changed:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

UI-only: `npm run lint` or targeted Vitest in `archlucid-ui` when cheap.

## Phase 4 — Fix, push, re-dispatch

```powershell
# From the <branch> worktree or checkout
.\scripts\agent\check-working-tree-path.ps1 -Path '<paths-you-will-edit>'

git add <scoped-paths>
git commit -m "fix(ci): <concise root-cause summary for <branch>"
git push origin <branch>

gh workflow run ci.yml --ref <branch>
```

Append to `.local/ci-watch-<branch>.log`: commit SHA, new run id after dispatch.

→ Return to **Phase 2** on the next 10-minute wake (or check once immediately after push if the user is waiting).

## Commit and push discipline

- Stage **only** paths changed for the CI fix.
- Never `git add -A` on a dirty tree.
- User must not need to name the branch again — it is `<branch>` from `/al-loopci`.
- Cherry-pick from `master` to release branches when the fix already landed on `master` and the release branch lacks it.

## User updates

On each wake, keep updates short:

- Run URL, status, elapsed time if useful
- On failure: root-cause clusters (not every job name)
- On fix: what changed, new commit, new run URL
- On green: final SHA and run URL

## Guardrails

- **CI workflow:** `ci.yml` only unless the user explicitly names another workflow.
- **Poll interval:** 10 minutes — do not poll faster unless the user overrides.
- **Indefinite retry:** keep the loop through multiple failure cycles; only stop on green or user stop.
- **Shell:** at most one `Shell` tool call per agent turn; chain `git` inspection in that call.
- **No speculative full builds** unless a fix requires it.

## Related

- `loop` skill — wake/sentinel mechanics
- `babysit` skill — PR comment + CI loop (PR-scoped)
- `docs/TEST_EXECUTION_MODEL.md` — CI tier map
- `.cursor/skills/al-ui-tableupdate/SKILL.md` — project skill conventions
