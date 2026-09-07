---
description: Log a production defect report, investigate it, and escalate/fix only if genuinely still broken
---

# Report a production defect (`/al-defect`)

Intake for **owner/operator-observed production defects** — distinct from a normal technical backlog item. The report is **logged first** as an investigation item in `docs/library/PRODUCTION_DEFECT_LOG.md`, then investigated. Only a **confirmed, still-broken** defect becomes a `TB-###` item in `docs/library/TECH_BACKLOG.md`; a defect that turns out to already be fixed is simply noted as fixed (and where).

**Git target:** the **first argument**, always required — this command commits/pushes a confirmed fix there (satisfies `.cursor/rules/Git-Commit-Requires-Branch.mdc` by construction, since the branch is always named in the same message).

---

## Arguments

```text
/al-defect <branch> "<description of what broke>"
```

- **`<branch>`** (required, first argument) — the branch to implement and commit a fix on, **if** the defect turns out to be confirmed and open. Existing or new; create it (from current `master`) in Step 5 if it doesn't exist yet. Still used as the git target even when disposition ends up being "already fixed" — in that case nothing is committed, but the argument is still required up front so the command never has to stop mid-run to ask for one.
- **`"<description of what broke>"`** (required, second argument) — quote it if it contains spaces (recommended); unquoted free text is also accepted as "everything after the branch name."
- **Optional screenshot attachment** — attach an image to the message. When present, read it and infer additional diagnostic context (see Step 1.3) rather than asking the reporter to retype what's visible on screen.

Optional inline context (parse from free text, anywhere in the description):

- **route / URL** — e.g. `route: /governance/findings`
- **environment** — e.g. `env: production` (default: assume production unless stated)
- **tenant / workspace** — if known
- **when** — timestamp or "just now"

Optional flags:

- **`--log-only`** — stop after logging + investigation; never escalate to implementation even if the defect is confirmed open (still creates the `TB-###` item, just doesn't fix it, and doesn't touch the branch argument)

If **both** the branch and the description are missing, and no screenshot was attached, stop and ask for at least a branch + either a description or a screenshot — do not fabricate a defect.

Examples:

```text
/al-defect fix/findings-500 "Findings page 500s when opening a finding with no evidence refs"
/al-defect main "governance alerts inbox shows stale counts after ack" env: production tenant: acme
/al-defect fix/export-timeout "export hangs, see attached" [+ screenshot attached]
/al-defect fix/dashboard-glitch --log-only [+ screenshot attached, no text description]
```

---

## Guardrails (read first)

- Follow `.cursor/rules/Agent-Working-Tree-Safety.mdc` before editing tracked files (`PRODUCTION_DEFECT_LOG.md`, `TECH_BACKLOG.md`, and any fix targets).
- Follow `.cursor/rules/shell-hygiene.mdc` / `shell-heartbeat.mdc` for any shell use — one `Shell` call per turn, Fast tier for git/grep inspection.
- **Never** mark a `PD-###` as **Verified fixed on `master`** or **Fixed on branch `<branch>`** without a concrete evidence pointer (commit SHA, file:line, or a currently-passing test that covers the exact reported scenario). If evidence is inconclusive, escalate to a `TB-###` instead of assuming it's fixed — a wrong "already fixed" hides a live defect.
- **Never** assign a `TB-###` or `PD-###` ID without first scanning for the current max ID in **both** `TECH_BACKLOG.md` and `TECH_BACKLOG_OPEN.md` (and this file for `PD-###`) — this repo has existing ID collisions (e.g. `TB-317`/`TB-318` reused across files); do not add a new one.
- **Log first, investigate second** — the `PD-###` entry must exist with Status **Investigating** before any codebase investigation starts, so a report is never lost if investigation stalls or the session ends.
- **Screenshot-derived context is inferred, not confirmed** — label it as such in the log; never assert a route, tenant, or error as reporter-confirmed fact when it was actually read off an image.
- Do not implement a fix (Step 5) if the user's message includes `--log-only` or otherwise asks only to log/investigate/report — stop after Step 4 and say so explicitly.
- The target branch (first argument) is only touched in Step 5, and only for disposition **C** without `--log-only`. Dispositions A/B/D never modify or create the target branch.

---

## Step 1 — Parse the report

1. **Branch** — the first argument, up to the start of the quoted description (or up to the first remaining token if unquoted). Required.
2. **Description** — the quoted string if present, otherwise the remaining free text after the branch. Extract any inline route/environment/tenant/timestamp context from it.
3. **Screenshot (optional)** — if the user's message has an attached image, read it (image-capable `Read`) and extract whatever is visible and relevant: the URL/route bar, error banner or toast text, stack trace or Problem Details JSON on screen, visible tenant/workspace name, timestamps, request/correlation IDs. Treat everything pulled from the image as **inferred** — tag it as such in the log entry rather than presenting it as reporter-confirmed fact.
4. If the description is empty after parsing but a screenshot was provided, draft a one-line description from the inferred screenshot content and proceed (tag it "inferred from screenshot" in the log).
5. If **both** branch and description/screenshot are missing, stop and ask.

## Step 2 — Log as an investigation item (before investigating)

1. Working-tree safety check:

   ```powershell
   .\scripts\agent\check-working-tree-path.ps1 -Path 'docs/library/PRODUCTION_DEFECT_LOG.md'
   ```

   If exit code **2**, stop and tell the user the path is blocked.
2. Read `docs/library/PRODUCTION_DEFECT_LOG.md`, find the highest existing `PD-###`, assign the next sequential ID.
3. Append a new `## PD-###` section (below the last one) with:
   - **Reported:** today's date
   - **Target branch:** `<branch>` (the first argument — where a confirmed fix will land)
   - **Reporter context:** route / environment / tenant / timestamp as given, marking anything pulled from a screenshot as **(inferred from screenshot)**
   - **Description:** the verbatim (or screenshot-drafted) report
   - **Screenshot:** the attached file path/name, or "none provided"
   - **Status:** `Investigating`
4. Add a matching row to the summary table.
5. When disposition will be **Escalated to TB-###** or **confirmed still broken**, map implicated production files to hunt zones (`python3 -c` via `scripts/agent/al_bug_escape_log.py` / ledger `paths`) and append one line to `docs/library/AL_BUG_ESCAPE_LOG.jsonl` (`source: al-defect`, `zoneId` or `unzoned`, `paths`, `ref: PD-###`, `huntedInPriorDays` from run log). Add `related-pd-tb` on a zone stanza **only** when path match is confirmed. No customer data in the escape log. CI may propose additional `source: ci` lines (`scripts/agent/al-bug-ingest-ci-escape.py --dry-run`); that is not a `PD-###`. Humans still own PD ids.

## Step 3 — Investigate

1. **Check for an existing item first** — grep `TECH_BACKLOG.md`, `TECH_BACKLOG_OPEN.md`, and this file for matching route/behavior/keywords. If a matching open or done `TB-###`/`PD-###` already exists, link to it instead of duplicating — skip to Step 4 with that finding.
2. **Locate implicated code** — use Grep/Glob against the reported route, component, or error text to find the likely files.
3. **Check `master`** — read the current implementation and any tests covering that exact scenario. Reason concretely about whether the reported behavior would still occur today; do not guess.
4. **Check other branches** — one Fast-tier `Shell` call:

   ```powershell
   git fetch --all --quiet; git log --all --oneline --grep='<keyword>' -i
   ```

   Also check the target branch (the first argument) directly if it already exists remotely/locally — `git log <branch> --oneline -20`. Note any relevant commit SHA and the branch it was found on (this may or may not be the target branch from the arguments — they're independent: the target branch is where a *new* fix will land if needed, not necessarily where an *existing* fix was found).
5. If genuinely unable to determine either way, treat it as **not yet confirmed fixed** — proceed to Step 4's "confirmed open" path rather than closing it speculatively.

## Step 4 — Disposition (pick exactly one)

**A. Already fixed on `master`**

- Update `PD-###`: **Status → Verified fixed on master**; cite the commit SHA / PR and the file:line or test that proves it.
- Do not create a `TB-###`.
- Go to Step 6.

**B. Fixed on some branch, not yet on `master`**

- Update `PD-###`: **Status → Fixed on branch `<branch where the fix was found>`, not merged**; cite branch name + commit SHA. This branch is whatever Step 3.4 found — it may differ from the target branch given as the command's first argument.
- Do not create a `TB-###` unless the user asks. Do not touch the target branch argument — nothing needs implementing.
- Go to Step 6 (suggest merging the branch that already has the fix, if appropriate).

**C. Confirmed still broken**

1. Scan `TECH_BACKLOG.md` (and `TECH_BACKLOG_OPEN.md`) for the current highest `TB-###`; assign the next sequential ID — do not reuse or guess.
2. Add a `## TB-###` detail section to `TECH_BACKLOG.md` following the file's existing conventions: **Problem** (quote the `PD-###` report + your root-cause finding), **Scope**, **Acceptance criteria**, **Likely files**, **Refs:** `PD-###`.
3. Add a summary-table row for the new `TB-###`.
4. Update `PD-###`: **Status → Escalated to TB-###**; link both ways (the `TB-###` section references `PD-###` as its source).
5. If `--log-only` was given, go to Step 6 now with disposition C and no fix.
6. Otherwise, continue to **Step 5**.

**D. Cannot reproduce**

- Update `PD-###`: **Status → Cannot reproduce**; list exactly what additional repro detail is needed (exact route, tenant/workspace, timestamp, request ID, screenshot).
- Do not create a `TB-###`.
- Go to Step 6.

## Step 5 — Fix it (disposition C only, unless `--log-only`)

Mirror the discipline in `.cursor/commands/ship-next-improvement.md`, targeting the branch given as the command's **first argument**:

1. Working-tree safety check on the target branch's likely touch surfaces before editing (per `.cursor/rules/Agent-Working-Tree-Safety.mdc`).
2. If the target branch doesn't exist yet (locally or on the remote), create it from the current `master`: `git checkout -b <branch> master` (or `git fetch origin master && git checkout -b <branch> origin/master`). If it already exists, check it out and pull latest.
3. Implement the fix for the new `TB-###` completely, with tests appropriate to scope.
4. **Quality gate** (in order, fixing issues before moving on): `/check-compiler-errors` → `/deslop` (diff vs `master`) → `/review-bugbot` (`Diff: uncommitted changes`) → `/review-security` (`Diff: uncommitted changes`) → re-run `/check-compiler-errors` if anything changed.
5. Mark `TB-###` **Done** in `TECH_BACKLOG.md` (title column + `Updated:` line with closure summary), run `python scripts/ci/refresh_tech_backlog_category_counts.py --write`, and update `PD-###` to **Escalated to TB-### — Done**.
6. Stage only paths changed for this fix — never `git add -A` on a dirty tree. Commit with a message referencing `TB-###` (style: `TB-###: <one-sentence why>.`), push to `<branch>`.
7. Run the **CI gate** — `/fix-ci` against the resulting PR or direct-push run, fixing failures one at a time until green.

## Step 6 — Report back (always)

```markdown
## Defect intake — PD-###

| Field | Value |
| --- | --- |
| Reported | <date> |
| Target branch (arg 1) | `<branch>` |
| Description | <one line, note if drafted from screenshot> |
| Screenshot | `<filename>` / none provided |
| Disposition | Verified fixed on master / Fixed on branch `<other branch>` / Escalated to TB-### / Cannot reproduce |
| Evidence | <commit SHA / file:line / test name> |
| TB item | TB-### — Done / Open / not created |
| Fix committed | `<branch>` @ `<sha>` / not committed (--log-only or disposition A/B/D) |
| CI | green / fixed via /fix-ci / n/a |
```

---

## Canonical files

- `docs/library/PRODUCTION_DEFECT_LOG.md` — investigation register (`PD-###`)
- `docs/library/TECH_BACKLOG.md` — technical backlog (`TB-###`), escalation target
- `docs/library/TECH_BACKLOG_OPEN.md` — open-items cross-check (may be stale; prefer live grep on `TECH_BACKLOG.md`)

## Related commands

- `/ship-next-improvement` — picks up and ships the *next* open backlog item (not defect-specific)
- `/fix-ci` — used in Step 5 once a fix is pushed
