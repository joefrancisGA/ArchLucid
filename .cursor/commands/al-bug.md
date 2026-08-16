---
description: Hunt a real code defect with a failing repro, fix it with tests, and push to master
---

# Bug hunt, fix, ship (`/al-bug`)

End-to-end **proactive defect** loop: find a **real** bug (prove it with a failing test or repro), implement a **minimal** fix, run **scoped** verification, and **push to `master`**.

Distinct from **`/al-defect`** (production defect intake + `PD-###` log) and **`/ship-next-improvement`** (backlog-driven feature work).

**Default git target:** **`master`** (user may override by naming another branch in the same message).

One invocation runs these phases **without stopping for approval between them** (except `--status`, which stops after the preview):

| Phase | Goal |
|-------|------|
| **0 — Target** | Score the hunt ledger; hunt **only** the picked zone |
| **1 — Find** | Prove a genuine defect in that zone with a failing test |
| **2 — Fix** | Minimal correct fix + permanent regression test |
| **3 — Ship** | Commit scoped paths and push to target branch |

---

## Arguments

```text
/al-bug
/al-bug master
/al-bug "<optional hunt hint>"
/al-bug master "<optional hunt hint>"
/al-bug --find-only
/al-bug master --find-only
/al-bug --status
/al-bug --refresh
```

- **`master`** (optional) — explicit branch target; default is **`master`** when omitted (satisfies `.cursor/rules/Git-Commit-Requires-Branch.mdc`).
- **`"<optional hunt hint>"`** — pin a ledger zone by id or alias (e.g. `topology merge gate`, `ARM resource ids`).
- **`--find-only`** — stop after Phase 1 with the bug report and failing repro; no fix, commit, or push.
- **`--status`** — run the picker preview and **stop** (no hunt, no ledger write).
- **`--refresh`** — pass `-Refresh` so git churn since `last-hunt` is recomputed into picker JSON; use those counts when updating the ledger.

Examples:

```text
/al-bug
/al-bug master
/al-bug "topology proposal graph merge"
/al-bug master --find-only
/al-bug --status
/al-bug --refresh
```

---

## Guardrails (read first)

- Follow `.cursor/rules/Agent-Working-Tree-Safety.mdc` before editing tracked files.
- Follow `.cursor/rules/shell-hygiene.mdc` and `.cursor/rules/shell-heartbeat.mdc` (Medium tier for scoped tests).
- Stage **only** paths changed for this bug; never `git add -A` on a dirty tree.
- **Repro-first:** do not “fix” until a test or repro **fails on current code**.
- **Minimal diff:** fix the root cause; no drive-by refactors.
- **No full-solution builds** unless scoped compile/test cannot cover the defect.
- **Do not** run `/fix-ci` or full CI unless the user explicitly asks — scoped tests + one compile check are enough for this command.
- **Do not** log `PD-###` / `TB-###` unless the user also asked for defect/backlog intake.

---

## Phase 0 — Target the next zone (required first)

**Before** hunting, editing production code, or claiming a bug, score the ledger and **display the picker preview in chat**.

```powershell
.\scripts\agent\al-bug-pick-zone.ps1 -Preview
```

Add `-Hint '<user hint>'` when the message named an area. Add `-Refresh` when the user passed `--refresh`.

The picker is **deterministic** (`docs/library/AL_BUG_HUNT_LEDGER.md` + `scripts/agent/al-bug-pick-zone.ps1`). Do **not** LLM-rank zones or fall back to a static “always topology first” walk.

Rules:

- Hunt **only** the returned `zoneId` (`paths` + open hypotheses). Do not invent another zone in the same invocation.
- If JSON `exhaustedAll` is `true`, **stop** — report that every zone is exhausted without git churn. Do not invent a new zone.
- If `--status`, print the preview and **stop** (do not hunt; do not write the ledger).
- The script does **not** write the ledger. After the hunt, you edit `AL_BUG_HUNT_LEDGER.md`.

### Exhaustion (leave the zone when all hold)

1. Every listed hypothesis has a passing regression test, or was retired as invalid.
2. **3 consecutive dry hunts**.
3. **No production-path commits** in that zone since `last-hunt`.

Set `status` to `cooling` when yield has dropped but exhaustion is not complete. Set `exhausted` only when all three hold. When picker JSON `reopened` is `true`, set `status` back to `open`.

### Dry hunt

If every listed open hypothesis was tested and **none** produced a failing repro: increment `hunts` and `consecutive-dry-hunts`, set `last-hunt` to today, tick or retire the attempted hypotheses, **stop**. Do not invent another bug in the same files or jump to another zone.

---

## Phase 1 — Find a real defect

### 1.1 Hunt the picked zone only

Work the picker’s `openHypotheses` against `paths`. Use `testFilter` for scoped tests. A user hint pins a zone; it does not authorize hunting other zones in the same run.

### 1.2 Prove it

1. Read the implicated code and existing tests.
2. Add a **focused unit test** (preferred) or a temporary repro test class that **fails on current `master`**.
3. Run scoped tests:

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj `
  --filter "FullyQualifiedName~<TestClassOrMethod>" 
```

Filter syntax: use `|` between patterns, not regex groups.

4. If you cannot make a test fail, **do not claim a bug** — try the next listed hypothesis in this zone. If none remain, treat the run as a **dry hunt** (Phase 0) and stop.

### 1.3 Phase 1 output (always)

Report:

- **Bug title** (one line)
- **Symptom** — what callers/users lose
- **Root cause** — file + mechanism
- **Repro** — test name or minimal steps
- **Severity** — high / medium / low

If `--find-only`, **stop here**.

---

## Phase 2 — Fix

1. Working-tree safety on every path you will edit:

```powershell
.\scripts\agent\check-working-tree-path.ps1 -Path '<path1>','<path2>'
```

Exit code **2** → stop; tell the user which paths are blocked.

2. Implement the **smallest** fix that makes the repro pass.
3. Keep the regression test in the permanent test file (delete temporary repro-only files).
4. Run scoped tests again — all relevant tests must pass.
5. Optional **one** scoped compile check when .NET production code changed:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

---

## Phase 3 — Ship to `master`

Target branch is **`master`** unless the user named another branch in the same message.

### 3.1 Prefer the push helper (dirty main tree)

When the main working tree has unrelated dirty files, push via isolated worktree:

```powershell
.\scripts\agent\al-bug-push-master.ps1 `
  -Paths @(
    'ArchLucid.Application/Runs/Orchestration/SomeFile.cs',
    'ArchLucid.Application.Tests/Runs/Orchestration/SomeTests.cs'
  ) `
  -CommitMessage @'
One-sentence why focused on the defect.

'@
```

`-TargetBranch master` is the default. Use `-TargetBranch <name>` when the user overrode the branch.

Add `-DryRun` to preview without push.

### 3.2 Direct commit (clean tree only)

When the main tree is clean except for your bugfix files:

```powershell
git add <scoped-paths>
git commit -m "Fix <concise defect description>."
git push origin master
```

### 3.3 Verify

```powershell
git fetch origin master
git log origin/master -1 --oneline
```

---

## Phase 4 — Report back (always)

After a hit or dry hunt, **edit** `docs/library/AL_BUG_HUNT_LEDGER.md` for the picked zone (`hunts`, `bugs-found`, `last-hunt`, `consecutive-dry-hunts`, hypothesis checkboxes, `status`). Include that file in the same ship when the hunt produced a product fix; for a dry hunt, ship the ledger update only.

```markdown
## /al-bug result

| Field | Value |
| --- | --- |
| Branch | `master` (or override) |
| Zone | `<zoneId>` |
| Dry or hit | dry / hit |
| Hypotheses left | N open (`- [ ]`) |
| Zone status | open / cooling / exhausted |
| Bug | <one-line title, or n/a if dry> |
| Root cause | <short mechanism, or n/a if dry> |
| Fix | <what changed, or ledger-only if dry> |
| Tests | <test names> — N passed |
| Commit | `<sha>` on `origin/master` |
| Left unstaged | <paths or none> |
```

---

## Canonical files

- `.cursor/commands/al-bug.md` — this workflow
- `.cursor/skills/al-bug/SKILL.md` — skill pointer + hunt heuristics
- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone yield, hypotheses, exhaustion
- `scripts/agent/al-bug-pick-zone.ps1` — deterministic next-zone picker
- `scripts/agent/al-bug-push-master.ps1` — worktree commit/push helper

## Related commands

- `/al-defect` — production defect intake (`PD-###`) from operator reports
- `/ship-next-improvement` — ship the next backlog / assessment item
- `/check-compiler-errors` — optional deeper compile verification
