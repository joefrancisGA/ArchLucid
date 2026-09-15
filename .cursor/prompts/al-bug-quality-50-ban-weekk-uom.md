# ABQ-50 — CI ban + ship-script hygiene for `weekk+` UOM farming

**After ABQ-48/49.** Extends ABQ-32 retired-class bans. Do not hunt `weekk+`. Topology-proposal-merge hunts may continue now; this ban must not restrict them. Still no `CORE_COMPACT`/`CORE_SPACED` `weekk+` maps.

## Goal

A PR that re-adds `HasCompactWeekkSuffix` (or any `HasCompactWeekk+Suffix` / `ContainsSpacedSlashWeekk+Token`) fails CI. Future `ship-hunts-*.py` must not grow those maps. Owner remains OK with **topology** short-token hunts; this ban is **core-costing week-letter-run farming only**.

## Why

ABQ-46 is documentation. Without a gate, the next 50-hunt batch will copy `ship-hunts-3481-3530.py` and add `week`+71 `k`s. Cooldown never fires on a new method name.

## Context

- Existing ban machinery: `scripts/ci/al-bug-ban-retired-classes.py`, `scripts/ci/al-bug-retired-class-allowlist.txt`, tests under `scripts/ci/tests/` (ABQ-32). **Reuse** that pattern; do not fork a second unrelated grep stack if this file already scans C#.
- Production keep-list methods stay allowlisted by **not matching** the extra-`k` regex.
- Hunt command already banned the class in ABQ-46.

## What to build

1. **Ban regex** (production + tests):
   - `HasCompactWeekk+Suffix` (one or more `k` after `Week` before `Suffix`)
   - `ContainsSpacedSlashWeekk+Token`
   - Test class names `AzureRetailPricesSkuMatchersWeekk` + extra `k`s + `Tests`
   - Do **not** match `HasCompactWeekSuffix`, `HasCompactWeekWordSuffix`, `HasCompactWeeksWordSuffix`, `SlashWeek`, `Weekes` (if keep-listed — `Weekes` is `Week`+`es`, not `Weekk`)

2. **CI:** blocking step on the existing fast job that already runs `al-bug-ban-retired-classes.py` (or add a sibling `scripts/ci/al-bug-ban-weekk-uom.py` if the retired-class script is a poor fit). Must **not** be `continue-on-error`.

3. **Fixture tests:** (a) a snippet file with `HasCompactWeekkSuffix` → fail; (b) `HasCompactWeekSuffix` → pass; (c) `AgentTopologyProposalMergeGateLbTests` / topology token `Contains("lb")` → pass (topology is allowed).

4. **Ship-scripts:** if any `scripts/agent/ship-hunts-*.py` is **tracked**, strip `CORE_COMPACT` / `CORE_SPACED` `weekk+` dictionaries (leave `TOPOLOGY` / context hits). Do **not** `git add` previously untracked ship scripts just to edit them. Add a short comment in `scripts/agent/` README or hunt command: new batches must not recreate those maps.

5. **`/al-bug` Phase 2 banner** (if not already done in 46): saturated core-costing must not farm UOM letter-runs.

6. Docs: one line in `AZURE_WEEK_UOM_KEEP_LIST.md` pointing at the ban script.

## Acceptance criteria

- CI fails if someone re-adds a `weekk+` matcher or test class.
- Topology matcher tokens are not banned.
- No `/al-bug` run. No new UOM synonyms.

## Constraints

- Closed defect-class enum **unchanged** (do not add `uom-letter-run` to the picker enum unless ABQ-21 owners already allow it — **prefer CI grep over enum growth**).
- Do not reopen TB-135/TB-136. Do not pen-test.
- Working-tree safety. Pester 5 for any new script tests.
- After this prompt, topology hunt batches remain allowed; core-costing hits require a **reachable** Azure `unitOfMeasure` citation (ABQ-05 + ABQ-46).
