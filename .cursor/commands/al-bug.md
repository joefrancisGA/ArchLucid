---
description: Hunt a real code defect with a failing repro, fix it with tests, and push to bugsmash
---

# Bug hunt, fix, ship (`/al-bug`)

End-to-end **proactive defect** loop: find a **real** bug (prove it with a failing test or repro), implement a **minimal** fix, run **scoped** verification, and **push to `bugsmash`**.

Distinct from **`/al-defect`** (production defect intake + `PD-###` log) and **`/ship-next-improvement`** (backlog-driven feature work).

**Default git target:** **`bugsmash`** (user may override by naming another branch in the same message).

**Every invocation is one of two kinds.** After the picker preview, announce the kind in chat **before** reading files or writing tests, then finish that kind. Do not silently skim and move on.

| Kind | When | What you must do |
| --- | --- | --- |
| **Seed hunt** | Picker JSON `seedHunt` is `true`, or zone `status` is `unseeded` | Say **This /al-bug run is a seed hunt** (zone id). Reseed hypotheses from the zone files (Phase 1.1a). If you promote a hunt-ready row, prove it in this same run. If nothing is hunt-ready, stop as **seed-only** and say so in the result table. |
| **Thorough hunt** | Otherwise | Say **This /al-bug run is a thorough defect hunt** (zone id). Complete cheap-disproof **and** failing-repro attempts on remaining hunt-ready rows. Ship a **hit** or a **dry** — never a file-skim exit. |

Queued `/al-bug` messages, cloud follow-up queues, and “defer slow testing while queued” **do not** change the kind or shorten it.

One invocation runs these phases **without stopping for approval between them** (except `--status`, which stops after the preview):

| Phase | Goal |
|-------|------|
| **−1 — Sync** | Pull latest `bugsmash` from origin (skip for `--status`) |
| **0 — Target** | Score the hunt ledger; hunt **only** the picked zone |
| **1 — Find** | Prove a genuine defect in that zone with a failing test |
| **2 — Fix** | Minimal correct fix + permanent regression test |
| **3 — Ship** | Commit scoped paths and push to target branch |

---

## Arguments

```text
/al-bug
/al-bug bugsmash
/al-bug "<optional hunt hint>"
/al-bug bugsmash "<optional hunt hint>"
/al-bug --find-only
/al-bug bugsmash --find-only
/al-bug --status
/al-bug --refresh
```

- **`bugsmash`** (optional) — explicit branch target; default is **`bugsmash`** when omitted (satisfies `.cursor/rules/Git-Commit-Requires-Branch.mdc`).
- **`"<optional hunt hint>"`** — pin a ledger zone by id or alias (e.g. `topology merge gate`, `ARM resource ids`).
- **`--find-only`** — stop after Phase 1 with the bug report and failing repro; no fix, commit, or push.
- **`--status`** — run the picker preview and **stop** (no hunt, no ledger write).
- **`--refresh`** — pass `-Refresh` so git churn since `last-hunt` is recomputed into picker JSON; use those counts when updating the ledger.

Examples:

```text
/al-bug
/al-bug bugsmash
/al-bug "topology proposal graph merge"
/al-bug bugsmash --find-only
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
- **Do not** shorten this run because another `/al-bug` is queued. Each message is an independent full kind (seed hunt or thorough hunt). Forbidden when anything is queued: skipping scoped tests, stopping after the picker without hunting (except `--status`), recording `seed-only` without reading zone `paths` and existing tests, recording `dry` without a failing-repro attempt on remaining hunt-ready rows, inventing another zone to reach the next queued command.

---

## Phase −1 — Sync `bugsmash` (required except `--status`)

Before hunting, editing production code, or claiming a bug, sync the integration branch:

```powershell
.\scripts\agent\al-bug-sync-branch.ps1
```

Add `-TargetBranch <name>` only when the user overrode the branch in the same message.

The script fetches `origin/bugsmash`, checks out `bugsmash`, and `git pull --rebase origin bugsmash`. If the remote branch does not exist yet, it creates local `bugsmash` from `origin/master`.

---

## Phase 0 — Target the next zone (required first)

**Before** hunting, editing production code, or claiming a bug, score the ledger and **display the picker preview in chat**.

```powershell
.\scripts\agent\al-bug-pick-zone.ps1 -Preview
```

Add `-Hint '<user hint>'` when the message named an area. Add `-Refresh` when the user passed `--refresh`.

The picker is **deterministic** (`docs/library/AL_BUG_HUNT_LEDGER.md` + `scripts/agent/al-bug-pick-zone.ps1`). Do **not** LLM-rank zones or fall back to a static “always topology first” walk.

Scoring is **explore/exploit**: hunts are the time unit. Prefer shorter mean hunts-per-bug once data exists; sample untried zones so the catalog can learn. **Hunt-ready** hypothesis count is a small tie-break only — **candidate** (template) rows must not lock the picker. Hypothesis **precision** (`proven / (proven + invalid)`) is a small bonus once at least two classified attempts exist. `valid-no-repro` is healthy exhaustion and does **not** lower precision.

Rules:

- Hunt **only** the returned `zoneId` (`paths` + hypotheses). Do not invent another zone in the same invocation.
- If JSON `seedHunt` is `true` or `status` is `unseeded`, this run is a **seed hunt** (Phase 1.1a) before any repro. This includes previously hunted zones whose stored hypotheses are all closed: read the source again and generate fresh mechanism-backed hypotheses; do not record a mechanical dry hunt.
- **Announce the kind immediately** after the picker table (the picker also prints a Kind banner). Copy one of:
  - `This /al-bug run is a **seed hunt** for zone \`<zoneId>\`. It reseeds hypotheses from the source files. It is not a thorough defect hunt unless a newly promoted hunt-ready row is proven in this same run.`
  - `This /al-bug run is a **thorough defect hunt** for zone \`<zoneId>\`. Cheap-disproof and failing-repro attempts run to completion even if other /al-bug messages are queued.`
- If JSON `exhaustedAll` is `true`, **stop** — report that every zone is exhausted without git churn. Do not invent a new zone.
- If `--status`, print the preview and **stop** (do not hunt; do not write the ledger).
- The script does **not** write the ledger. After the hunt, you edit `AL_BUG_HUNT_LEDGER.md`.

### Exhaustion (leave the zone when all hold)

1. Every listed hypothesis has a passing regression test, or was retired as `(invalid)` or `(valid-no-repro)`.
2. **3 consecutive dry hunts**.
3. **No production-path commits** in that zone since `last-hunt`.

Set `status` to `cooling` when yield has dropped but exhaustion is not complete. Set `exhausted` only when all three hold. When picker JSON `reopened` is `true`, set `status` back to `open`. New zones start as **`unseeded`** (zero hunt-ready rows) until a seed hunt reads the files.

### Dry hunt

If every **hunt-ready** hypothesis was tested and **none** produced a failing repro: increment `hunts` and `consecutive-dry-hunts`, set `last-hunt` to today, tick attempted rows with **`(valid-no-repro)`** or **`(invalid)`** (see Phase 1.1c), **stop**. Do not invent another bug in the same files or jump to another zone.

A **seed-only** pass (files read, candidates promoted or retired, no failing repro) increments `hunts`, sets `last-hunt`, sets `status` to `open`, and does **not** increment `consecutive-dry-hunts`.

---

## Phase 1 — Find a real defect

### 1.1 Hunt the picked zone only

Work the picker’s hypotheses against `paths`. Use `testFilter` for scoped tests. A user hint pins a zone; it does not authorize hunting other zones in the same run.

**Hunt `huntReadyHypotheses` as claims. Treat `candidateHypotheses` as search lenses only** until a seed hunt promotes them.

### 1.1a Seed hunt (when `seedHunt` is true)

Do **not** spend a full repro loop on template candidates. Read the zone `paths` and existing tests first, then:

1. **Promote** a candidate to `(hunt-ready)` only when it meets the quality bar (1.1b).
2. **Retire** a candidate as `(invalid)` when the locus or prerequisite does not exist in these files.
3. If you promote a hunt-ready row, **prove it in this same run** (failing repro). A proven row makes this seed hunt a **hit**. Do not leave a new hunt-ready row untested because another `/al-bug` is queued.
4. If nothing is hunt-ready after the read, stop as **seed-only** (not a dry hunt), keep the seed-hunt banner in the result table, and do not invent a fourth generic template.

For a previously hunted zone with no open rows, reseed from fresh evidence rather than copying old mechanisms:

- compare sibling paths for checks present on one path but absent on another;
- inspect uncovered branches from the latest coverage artifact;
- inspect surviving mutants when a scoped Stryker target exists;
- inspect recent production changes that did not add or modify tests;
- try serialization, null/empty, enum, culture/UTC, cancellation, retry/idempotency, and concurrency lenses;
- use `-Nominate` when the implicated files are outside every current zone.

Do not add new zones. Do not refill a zone with three untagged harm-class rows.

### 1.1b Hunt-ready quality bar

A row stays **open** as hunt-ready only when all five are filled from the zone files (not from a bug-class template):

| Field | Required |
| --- | --- |
| **Locus** | File + method, SQL fragment, or branch |
| **Input** | Concrete value that takes that branch |
| **Wrong outcome** | Observable failure (wrong row, 200, empty success) |
| **Why this code** | Mechanism — omitted predicate, disagreeing module, untested type family |
| **Reachability** | Where the input originates: a real ARM/Terraform property, a config path in this repo, an OpenAPI payload, a UI action, or an attacker-controlled trust-boundary string. Constructed literals without that citation stay `(candidate)` or `(invalid)`. |

Ban as hunt-ready (keep as `(candidate)` or retire as `(invalid)`) any row that only restates a harm class: “cross-tenant leak”, “stale cache after scope switch”, “returns 200 on failure”. Those are lenses. Apply them only after the files show the prerequisite (a join, a cache, a catch that returns success).

Also ban hunt-ready rows whose **input** is a constructed string with no reachability citation (for example `beefAccessKey` with no ARM, config, OpenAPI, or UI path that could emit it). A concrete value that merely exercises a branch is not enough.

Prefer mechanisms that have paid off in this catalog: dual-path disagreement (gate vs merge, parent SQL vs child join, watchdog vs visibility), alias/identity mismatch, parameterized-test holes, recent churn with no new test.

**Guard failure direction:** for redaction, validation, authz, and schema readers, the conservative failure mode (over-redact, reject malformed, deny) is usually `(valid-no-repro)` unless reachability shows a real caller or attacker-controlled input. Fail-open / leak / accept malformed as success is hunt-eligible. Severity must name user-visible harm (secret in summary, cross-tenant 200, committed bad manifest). “Test disagreed with an allowlist” is not medium/high.

### 1.1c Cheap disproof (before a repro)

For each hunt-ready row, spend about a minute on:

1. **Locus exists?** Grep the method, SQL fragment, hook, or cache key. Missing → `(invalid)`.
2. **Already tested?** An existing test name already states the claim → `(valid-no-repro)` and cite the test.
3. **Prerequisite present?** No `useQuery` / session / child join → `(invalid)` for cache/join claims.
4. **Churn?** If the claim is the already-fixed TB/PD and `codeChangedSince` is 0, expect `(valid-no-repro)`.
5. **Reachable?** No citation for where the input originates (ARM/config/OpenAPI/UI/trust boundary) → `(invalid)` or leave `(candidate)`.

Only **plausible-untested** hunt-ready rows consume a failing-repro attempt.

Ledger tags for closed rows:

- `(proven)` — failing repro, then fix (or already shipped in this hunt).
- `(invalid)` — claim does not describe this code (path missing, wrong shape).
- `(valid-no-repro)` — claim matches this code; current behavior is correct.

Do **not** tick a miss as bare `[x]`. Bare `[x]` is treated as proven.

### 1.1d Inverse hypothesis

If the listed claim is false, spend a few minutes on the dual before declaring dry: the **opposite** wrong outcome on the **same locus** (for example “commit proceeds after integrity failure” vs “rejected traces blocked commit after retry”). Promote that dual to `(hunt-ready)` only if it meets 1.1b.

### 1.2 Prove it

1. Read the implicated code and existing tests.
2. Add a **focused unit test** (preferred) or a temporary repro test class that **fails on current `bugsmash`**.
3. Run scoped tests:

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj `
  --filter "FullyQualifiedName~<TestClassOrMethod>" 
```

Filter syntax: use `|` between patterns, not regex groups.

4. If you cannot make a test fail, **do not claim a bug** — try the next **hunt-ready** hypothesis in this zone. If none remain, treat the run as a **dry hunt** (Phase 0) and stop.

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
3. The fix must close a **class** of inputs, not one instance. Forbidden as the entire fix: appending one string to a keyword/phrase/allowlist so a single new theory case passes. If the mechanism is substring or phrase matching, change the mechanism (see ABQ tokenizer/redaction patterns) or close the row `(valid-no-repro)` — do not ship an instance-list diff.
4. Keep the regression test in the permanent test file (delete temporary repro-only files).
5. Run scoped tests again — all relevant tests must pass.
6. Optional **one** scoped compile check when .NET production code changed:

```powershell
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

---

## Phase 3 — Ship to `bugsmash`

Target branch is **`bugsmash`** unless the user named another branch in the same message.

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

`-TargetBranch bugsmash` is the default. Use `-TargetBranch <name>` when the user overrode the branch.

Add `-DryRun` to preview without push.

### 3.2 Direct commit (clean tree only)

When the main tree is clean except for your bugfix files:

```powershell
git add <scoped-paths>
git commit -m "Fix <concise defect description>."
git push -u origin bugsmash
```

### 3.3 Verify

```powershell
git fetch origin bugsmash
git log origin/bugsmash -1 --oneline
```

---

## Phase 4 — Report back (always)

After a hit, dry hunt, or seed-only pass, **edit** `docs/library/AL_BUG_HUNT_LEDGER.md` for the picked zone (`hunts`, `bugs-found`, `last-hunt`, `consecutive-dry-hunts`, hypothesis tags, `status`). Include that file in the same ship when the hunt produced a product fix; for a dry or seed-only hunt, ship the ledger update only.

Then **record the outcome** and print rolling **24-hour** yield (do **not** record for `--status` preview-only runs):

```powershell
.\scripts\agent\al-bug-rolling-stats.ps1 `
  -RecordHunt `
  -HuntZoneId '<zoneId>' `
  -HuntOutcome hit   # hit | dry | seed-only — match the run result
  -Rolling24h
```

- **`hit`** — failing repro proved (fixed and shipped, or `--find-only` stop after repro).
- **`dry`** — hunt-ready hypotheses tested; no failing repro.
- **`seed-only`** — seed hunt with no failing repro; does **not** count as a dry run in 24h stats.

Include `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` in the same commit as the ledger update (always, for every completed hunt).

Replacement hypotheses after a miss must cite a **different mechanism** plus **reachability**, not the same template with new nouns. Do not template-seed an `unseeded` zone with three harm-class rows.

If the only fix is an instance-list append and severity is low, **stop and report** instead of pushing — do not treat sequential low-severity hits as success.

```markdown
## /al-bug result

| Field | Value |
| --- | --- |
| Kind | seed hunt / thorough hunt |
| Outcome | hit / dry / seed-only |
| Branch | `bugsmash` (or override) |
| Zone | `<zoneId>` |
| Hunt-ready left | N |
| Candidates left | N |
| Zone status | unseeded / open / cooling / exhausted |
| Bug | <one-line title, or n/a if dry/seed-only> |
| Root cause | <short mechanism, or n/a if dry> |
| Fix | <what changed, or ledger-only if dry/seed-only> |
| Tests | <test names> — N passed |
| Commit | `<sha>` on `origin/bugsmash` |
| Left unstaged | <paths or none> |
| Bugs found (24h) | N |
| Dry runs (24h) | N |
```

**Kind** is the picker decision (`seedHunt` true → seed hunt; else thorough hunt). **Outcome** is what the run produced. A seed hunt that proves a new row is Kind `seed hunt` and Outcome `hit`. Never omit Kind. Never report a thorough hunt as `seed-only`.

Copy the **Bugs found (24h)** and **Dry runs (24h)** values from the `-Rolling24h` table the script prints.

---

## Canonical files

- `docs/architecture/AL_BUG_QUALITY_COMPOSER_PROMPTS.md` — Composer set **ABQ-01–10** (hunt-quality; paste one `.cursor/prompts/al-bug-quality-NN-*.md` per session; do not implement quality reforms by running `/al-bug`)
- `.cursor/commands/al-bug.md` — this workflow
- `.cursor/skills/al-bug/SKILL.md` — skill pointer + hunt heuristics
- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone yield, hypotheses, exhaustion
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — append-only hunt outcome log (UTC timestamps)
- `scripts/agent/al-bug-pick-zone.ps1` — deterministic next-zone picker
- `scripts/agent/al-bug-rolling-stats.ps1` — rolling 24h hunt yield log + preview
- `scripts/agent/al-bug-sync-branch.ps1` — fetch, checkout, and pull `bugsmash`
- `scripts/agent/al-bug-push-master.ps1` — worktree commit/push helper (default `bugsmash`)

## Related commands

- **ABQ-01–10** — hunt-quality Composer prompts (`.cursor/prompts/al-bug-quality-00-index.md`)
- `/al-defect` — production defect intake (`PD-###`) from operator reports
- `/al-bug-api` — same hunt workflow via Cloud Agent API (default `bugsmash`)
- `/ship-next-improvement` — ship the next backlog / assessment item
- `/check-compiler-errors` — optional deeper compile verification
