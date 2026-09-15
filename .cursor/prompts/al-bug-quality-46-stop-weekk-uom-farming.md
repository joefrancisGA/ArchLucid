# ABQ-46 — Stop shipping synthetic `weekk+` UOM hunts

**Docs/commands/skill only.** Do not delete matcher methods here (ABQ-48). Do not delete tests here (ABQ-49). Do not run `/al-bug`. Do not start a topology hunt batch in this session.

## Goal

Make it impossible for the next `/al-bug` or `ship-hunts-*.py` run to treat “one more `k` on `week`” as a hunt-ready core-costing hit. Owner decision 2026-09-15: **stop shipping new `weekk+` / spaced-slash ` / weekk+` matchers.** Cleanup of existing residue is ABQ-47–50. Topology-proposal-merge hunts may continue **now** on other branches; do not mix them into this stop-ship PR.

## Why

`IsWeekMeter` is a closed allowlist with a “token not followed by a letter” boundary. That made `10week` match and `10weekk` fail, so hunts invented `10weekkk…k` (70+ extra `k`s) that Azure Retail Prices never emits. Those hits fail ABQ-05 **Reachability**. Continuing them is a mistake, not a catalog-parity program.

## Context

Edit all of:

- `.cursor/commands/al-bug.md` — Phase 1.1b / 1.1c / Phase 2 (hunt-ready + fix-generality)
- `.cursor/skills/al-bug/SKILL.md` — same ban in the short pointer; do not diverge
- `docs/library/AL_BUG_HUNT_LEDGER.md` — **How to use** / core-costing zone notes only; **do not** mass-rewrite historical `(proven)` rows
- `.cursor/commands/al-bug-api.md` — one-line pointer that API hunts use the same bar (already true; add the UOM example)

Do **not** edit `ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs` in this prompt.

## What to build

1. **Hunt-ready ban (1.1b Reachability).** Explicit example of a **non-reachable** input: any unit-of-measure string whose week token is `week` plus **one or more extra `k` characters** (`weekk`, `weekkk`, …) or the spaced-slash form ` / week` plus extra `k`s (`10 / weekkk…`). Same ban for extra-vowel farms (`weeeeek` beyond the finite keep-list in ABQ-47). Cite: Azure Retail Prices `unitOfMeasure` values are quantity + a short unit (`1 Hour`, `1/Week`, `1 Week`), not unbounded letter runs.

2. **Fix-generality (Phase 2).** Forbidden as the entire fix: adding `HasCompactWeekk+Suffix` / `ContainsSpacedSlashWeekk+Token` (or a new test file named `AzureRetailPricesSkuMatchersWeekk+Tests`) so one new theory case passes. Point at ABQ-48 for deletion, not “one more method.”

3. **core-costing cheap-disproof.** If the only failing input is a constructed `weekk+` literal, classify `(invalid)` (not hunt-ready). Do not ship a hit.

4. **Ship-script warning** in the command (one paragraph): untracked `scripts/agent/ship-hunts-*.py` must not grow `CORE_COMPACT` / `CORE_SPACED` `weekk+` maps. Topology `TOPOLOGY` maps remain allowed after cleanup. Context-ingestion JSON field aliases are **not** in scope for this prompt (do not ban them here).

5. Ledger How-to: one sentence that historical `weekkk…` ledger lines stay as history; new hunts must not copy them.

## Acceptance criteria

- A reviewer can reject `10weekkkkkkk` as not hunt-ready using only the updated 1.1b text.
- Command and skill agree. No matcher/test deletion in this PR.
- No `/al-bug` invocation. No topology batch **in this session** (topology may continue in a different session/branch).

## Constraints

- Working-tree safety on the four tracked files.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Do not hide desktop review workspace tabs.
- Do not retcon ledger `bugs-found` counters.
