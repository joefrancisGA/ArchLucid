# ABQ-43 — Cap paste-ready seeder spam (cross-seeder dedup)

**After ABQ-23/26/31 (shipped).** Do not lower the hunt-ready bar. Do not write the ledger from seeders. Do not hunt.

## Goal

Analyzer, surviving-mutant, and flake seeders each cap **15** and dedup **within** one tool. A seed hunt can paste **45** `(candidate)` lines that collide on the same path+line. Add **cross-seeder** dedup (path + line, or path + mutator/test) and a **combined cap of 15** when the agent runs more than one seeder in one preview. Optional ledger lint: a zone with **> 30** open `(candidate)` rows and **0** hunt-ready after `last-hunt` is preview-flagged (`candidateSpam: true`) — do not auto-delete rows.

## Why

Wave 5 multiplied seed sources. Candidates do not score (ABQ-06), but they bury 1.1b and make seed-only look productive. Dedup across tools is cheaper than another cooldown.

## Context

- `scripts/agent/al-bug-seed-from-analyzers.ps1`
- `scripts/agent/al-bug-seed-from-surviving-mutants.ps1`
- `scripts/agent/al-bug-seed-from-flake-log.py`
- `.cursor/commands/al-bug.md` Phase 1.1a — three optional seeder sentences
- `scripts/agent/al_bug_ledger.py` — `parse_zones`
- Picker: **no** score term for candidate count (keep)

Prefer a small **orchestrator** (`al-bug-seed-preview.ps1` or Python) that calls the three preview functions and merges. Do not rewrite each seeder’s parser.

## What to build

1. **Merge preview:** stdin or files of markdown candidate lines → unique by `path:line` (regex the seeder line shape already emits). Cap 15. Stable sort: mutants first, then analyzers, then flakes (or the reverse — pick one, test it).

2. **Command 1.1a:** “If you run more than one seeder, merge through the orchestrator; do not paste three raw dumps.”

3. **Optional picker JSON** `openCandidateCount` + `candidateSpam` when open candidates > 30 and hunt-ready is 0. Eligibility unchanged in v1 (flag only) unless Pester makes a tiny cooling rule cheap — default **flag only**.

4. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugSeedPreviewMerge.Tests.ps1'
```

and/or

```text
python3 scripts/tests/test_al_bug_seed_preview_merge.py
```

Cover: (a) same path:line from mutant + analyzer → one line; (b) 20 unique lines → 15 emitted; (c) empty inputs → empty preview, exit 0; (d) existing single-seeder tests still pass.

## Acceptance criteria

- Combined preview cap 15. Ledger still human-paste only.
- Hunt-ready bar unchanged. No picker score for candidate volume.
- Closed enum unchanged.

## Constraints

- Do not recreate `_al-bug-pick-zone.ps1`.
- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Pester 5. Check nulls.
