# Merge open PRs — `/al-merge`

Batch-merge **all open** GitHub pull requests for this repository. Intended for operator-driven clears of automation queues (for example `aspects/*` cancellation batches) where PRs are **mergeable** but **BLOCKED** on required checks.

**Default merge:** `gh pr merge --merge --admin` (bypasses branch protection). **Does not** merge PRs with `mergeable=CONFLICTING`.

Default model: **Composer 2.5 slow** (`composer-2.5`).

---

## Arguments

```text
/al-merge
/al-merge --dry-run
/al-merge --require-checks
/al-merge --squash
```

| Flag | Meaning |
|------|---------|
| *(none)* | Merge all open PRs with **admin** bypass until the queue is empty (up to 30 rounds). |
| **`--dry-run`** | List open PRs and what would be merged; **no** `gh pr merge` calls. |
| **`--require-checks`** | **No** `--admin`. Only merge when `mergeStateStatus` is **CLEAN**; skip others. |
| **`--squash`** | Use `gh pr merge --squash` instead of `--merge`. |

---

## Guardrails

1. Run from **repository root** (the git remote `gh` uses for this repo).
2. Requires **`gh`** authenticated (`gh auth status` must succeed).
3. **Warn the user in chat** when using default admin merge: required CI may not have finished.
4. **Do not** use this for a single named PR the user wants reviewed — use `gh pr merge <n>` manually or ask which PR.
5. **Do not** force-push or rebase `master`/`main`.
6. Follow **`.cursor/rules/shell-hygiene.mdc`** — one script invocation, no background watchers.

---

## Steps

1. Optional: `gh pr list --state open --limit 20` so the user sees the starting queue.
2. Run the helper from repo root:

**Windows (PowerShell):**

```powershell
.\scripts\agent\al-merge-open-prs.ps1
```

With flags:

```powershell
.\scripts\agent\al-merge-open-prs.ps1 -DryRun
.\scripts\agent\al-merge-open-prs.ps1 -RequireGreenChecks
.\scripts\agent\al-merge-open-prs.ps1 -MergeMethod squash
```

**macOS/Linux (Cloud Agent):**

```bash
pwsh -NoProfile -File scripts/agent/al-merge-open-prs.ps1
```

3. Reply with:
   - Count merged and PR numbers (range or list)
   - Any failures or skips
   - **Remaining open count** (script exits **4** if PRs still open after max rounds)
   - Reminder that admin merge skipped the green-check gate unless `--require-checks` was used

4. If automation opens PRs faster than the loop drains them, offer to run **`/al-merge`** again or increase `-MaxRounds` only when the user asks.

---

## Script parameters (agent / operator)

| Parameter | Default | Notes |
|-----------|---------|--------|
| `-Limit` | 100 | Max open PRs fetched per round |
| `-MaxRounds` | 30 | Stops when empty or cap hit |
| `-PauseSeconds` | 2 | Wait between rounds for new PRs to appear |
| `-ContinueOnError` | off | Keep going after a single PR merge failure |

---

## Acceptance criteria

- [ ] User invoked `/al-merge` (or equivalent natural language with this command intent).
- [ ] Helper script ran from repo root; exit code reported.
- [ ] Summary lists merged PR numbers and whether admin bypass was used.
- [ ] If queue not empty, user told explicitly (not silent success).
