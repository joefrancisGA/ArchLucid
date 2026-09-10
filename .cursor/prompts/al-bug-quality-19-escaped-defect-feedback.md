# ABQ-19 — Escaped-defect feedback loop (PD/CI/pilot → zone escape rate)

**After ABQ-16 (shipped).** Do not change `Get-MeanHuntsPerBug` or rewrite historical `bugs-found`. Do not invent `PD-###` / `TB-###` ids. Do not hunt.

## Goal

Zones that `/al-bug` hunts often but still leak real defects lose ranking credit. Defects that arrive **outside** `/al-bug` (`/al-defect` `PD-###`, CI failures on production paths, first-pilot proof failures) record which hunt **zone** they lived in and whether that zone was hunted recently. Picker preview exposes an **escape rate** so humans can see the metric Goodhart cannot game.

## Why

ABQ-06/16 stop the picker from celebrating inflated `bugs-found`. They still optimize **self-reported hunt yield**. An escaped defect (operator report, red CI on a zone path, sponsor-proof mismatch) is the only signal the hunt loop does not write. The scoring formula already has `related_PD_or_TB` (`+1 × min(2, id count)` in `docs/library/AL_BUG_HUNT_LEDGER.md` § Scoring and `Get-ZoneScoreBreakdown` in `scripts/agent/al-bug-pick-zone.ps1`), but zone stanzas almost never fill `related-pd-tb`, `/al-defect` never maps a `PD-###` onto a zone, and nothing records “this zone was hunted last week and the bug still escaped.”

## Context

Reuse; do not duplicate parsers:

- `docs/library/PRODUCTION_DEFECT_LOG.md` — `PD-###` intake (`/al-defect`)
- `.cursor/commands/al-defect.md` — log-first; dispositions A–D
- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone `paths`, optional `related-pd-tb`, scoring
- `scripts/agent/al-bug-pick-zone.ps1` — already parses `related-pd-tb` via `Get-RelatedIdCount`
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — hunts by `zoneId` / `at` / `outcome`
- `scripts/agent/al-bug-lint-ledger-counters.py` — zone stanza parser pattern
- `scripts/agent/al-bug-audit-proven-rows.py` — `parse_zones` / `FIELD_ID`

Do **not** retag thousands of ledger hypotheses. Do **not** add English-phrase signals to the validity audit (index won’t-do).

## What to build

1. **Escape log** (append-only JSONL, one line per escaped defect). Prefer `docs/library/AL_BUG_ESCAPE_LOG.jsonl` next to the hunt run log. Schema (keep old lines valid if you add fields later):

   | Field | Required | Meaning |
   | --- | --- | --- |
   | `at` | yes | ISO-8601 UTC |
   | `source` | yes | `al-defect` \| `ci` \| `pilot-proof` |
   | `zoneId` | yes | existing ledger zone id, or `unzoned` |
   | `paths` | yes | implicated production paths (array) |
   | `ref` | yes | `PD-###`, CI run URL/check name, or proof script name |
   | `huntedInPriorDays` | yes | integer days since that zone’s last hunt in the run log, or `-1` if never |

   Do **not** store customer data, secrets, or stack traces. Title/ref only.

2. **`/al-defect` Step 2/4:** after logging the `PD-###`, match implicated files (from investigation, not from guessing) to ledger `paths` prefixes. Append one escape-log line when disposition is **Escalated to TB-###** or **still broken**. If no zone matches, use `zoneId: unzoned` and tell the agent to consider `-Nominate` (ABQ-09 already exists). Add a `related-pd-tb` bullet on the matching zone stanza **only when you already have a confirmed path match** — do not spray PD ids onto unrelated zones.

3. **Mapper script** (Python next to the other `al-bug-*.py` tools): given a path list, return covering zone ids. Unit-test with a fixture ledger snippet. `/al-defect` and the picker both call this — one implementation.

4. **Picker:** compute per-zone `escapeCount90d` and `escapeRate90d` (`escapes / max(1, hunts in 90d)` from run log + escape log). Preview JSON adds `escapeCount90d`, `escapeRate90d`. Scoring: subtract a **small** penalty, e.g. `− 3 × min(1, escapeRate90d)` **or** `− 1` when `escapeCount90d ≥ 1` in 90 days — pick one, document it in the ledger Scoring block, and test it. Do **not** let escapes zero out explore bonus on untried zones (untried + an escape should still be hunted). Unzoned escapes do not penalize a random zone.

5. **CI (optional, cheap):** a Python lint that the escape log is valid JSONL and every `zoneId` other than `unzoned` exists in the ledger. Wire next to `al-bug-lint-ledger-counters.py` in `azure-extractor-pester` (that job may be `continue-on-error` — still add the step). Do **not** fail CI because the escape log is empty.

6. **Ledger How-to:** one short paragraph: hunt yield is not product quality; cite escape rate; link `/al-defect`. Optional catalog rollup in `-Preview` only (do not hand-edit a number on every hunt).

7. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
```

```text
python3 scripts/tests/test_al_bug_escape_log.py
```

Fixtures: (a) PD path under `topology-proposal-merge` `paths` → that `zoneId`; (b) path under no zone → `unzoned`; (c) zone with 10 hunts / 2 escapes in 90d gets a lower score than the same zone with 0 escapes, holding other terms fixed; (d) malformed JSONL → lint exit 1.

## Acceptance criteria

- `/al-defect` command text tells the agent to append an escape-log line on confirmed-open defects and to fill `related-pd-tb` only on path match.
- Picker JSON includes escape counters; scoring change is documented and covered by Pester.
- Empty escape log is valid. Historical hunt ledger rows are unchanged except optional `related-pd-tb` on zones you actually matched in this PR (likely none — do not backfill PD-001–003 unless the files still match).
- No new phrase-class signals in `al-bug-audit-proven-rows.py`.

## Constraints

- Do not create `PD-###` rows in this session.
- Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92.
- Do not run `/al-bug` or `/al-defect` except as doc edits.
- Working-tree safety on every tracked path.
- Pester 5 only (`Should -Be`, `BeforeAll`).
- Each new type in its own file. Check nulls. Prefer concrete types over `var`.
