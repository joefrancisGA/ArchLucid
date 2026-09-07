# ABQ-44 — Ghost zone-path lint (deleted files)

**After ABQ-09/24 (shipped `-Nominate`).** Do not auto-add zones. Do not hunt. Do not invent `PD-###`.

## Goal

Ledger zone `paths:` prefixes can point at files that no longer exist after a rename. Nominate finds **gaps** (churn with no zone); nothing finds **ghosts** (zone prefixes with no files). Add a lint: each `paths` entry must match at least one existing production file **or** directory under the repo root. Warn or fail on ghosts. Do not mass-edit the ledger in this prompt except to fix **paths you broke** or a **small** allowlist of known retired prefixes.

## Why

Hunts read dead files, `-Nominate` does not reopen those zones, and `code-changed-since` git log on a missing path is silently empty. Ghost prefixes make exhaustion look true (no commits on `paths`) while the real code moved.

## Context

- `docs/library/AL_BUG_HUNT_LEDGER.md` — `paths:` bullets
- `scripts/agent/al_bug_ledger.py` — `parse_zones`
- `scripts/agent/al-bug-pick-zone.ps1 -Nominate` — gaps, not ghosts
- Retired mega-zone `archlucid-core` — if it still has a stanza, either skip retired statuses or allowlist that id
- `scripts/agent/al-bug-lint-ledger-counters.py` — sibling lint pattern; do not fork zone parsing

## What to build

1. **`scripts/agent/al-bug-lint-zone-paths.py`:**

   - For each zone with `status` not `exhausted` **or** for all zones (pick one, document it): split `paths` on `;`, trim, test `os.path.exists` **or** any file under that prefix (`os.path.isdir` / glob).
   - Missing → collect `zoneId|path`. Exit 1 if any (or warn-only with `--warn`; CI default: **warn-only** `continue-on-error` until the first clean run, then blocking — same policy as ABQ-34).
   - Skip test/docs/generated prefixes if the ledger should not list them (nominate already excludes those).

2. **CI:** `azure-extractor-pester` step next to ledger-counter lint.

3. **Docs:** How-to / Nominate: after a rename, update `paths` or the zone is a ghost. Do not create new zones here unless `-Nominate` output is pasted **and** the user asked (they did not — lint only).

4. Tests:

```text
python3 scripts/tests/test_al_bug_lint_zone_paths.py
```

Cover: (a) fixture zone path `ArchLucid.Application/DoesNotExist.cs` → fail; (b) existing Application file prefix → pass; (c) directory prefix with files → pass; (d) retired/allowlisted id skipped if you implement that skip.

## Acceptance criteria

- Lint exists and is wired (warn-only OK on the first PR if `master` has ghosts — list them; do not rewrite hundreds of stanzas).
- Nominate behavior unchanged.
- No English-phrase validity signals.

## Constraints

- Do not recreate `_al-bug-pick-zone.ps1`.
- Do not run `/al-bug`. Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Check nulls.
- Do not hide desktop review workspace tabs.
