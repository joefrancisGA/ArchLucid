# ABQ-47 — Inventory keep vs delete for week UOM matchers

**Read-only except one keep-list doc.** Do not delete production matchers (ABQ-48) or tests (ABQ-49). Do not run `/al-bug`. Depends on **ABQ-46** being pasted or at least understood: no new `weekk+` hunts while inventorying.

## Goal

Produce an authoritative keep-list vs delete-list so ABQ-48/49 can execute without guessing. Azure Retail Prices week meters are **short** unit tokens (`Week`, `1/Week`, `wk`). Unbounded `week`+`k` runs are synthetic.

## Why

`AzureRetailPricesSkuMatchers.cs` mixes real synonyms (`week`, `weeks`, `wk`, `/week`) with a farmed chain (`HasCompactWeekkSuffix` … 70 extra `k`s, plus spaced-slash twins). A delete-all would drop legitimate compact `10week` and slash-week matching.

## Context

Primary files (read; do not edit except the deliverable):

- `ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs` (`IsWeekMeter` and callees)
- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchers*Tests.cs` (~227 files as of 2026-09-15)
- Untracked `scripts/agent/ship-hunts-*.py` `CORE_COMPACT` / `CORE_SPACED` maps (list them; do not commit them in this prompt)

**Locked keep-list (do not expand without citing a real Azure `unitOfMeasure` sample in-repo or Microsoft price-list docs):**

| Keep | Reason |
| --- | --- |
| `week` / `weeks` (word, slash `/week`, spaced ` / week`, compact digit+`week`) | Real catalog / quantity+unit |
| `wk` / `wks` and slash/spaced/compact forms | Common abbreviation |
| bounded ` w` / slash `w` if already present for week meters | Finite; do not add new single-letter tokens in this prompt |
| `wek` / `wel` / `weks` (≤3-letter typo class **already in tree**) | Finite OCR/typo; **do not add** more 3-letter variants |
| `weel` / `weels` / `weekes` **already in tree** | Finite; **do not add** `weeeeek` |

**Locked delete rule:**

- Method or test whose week token is `week` plus **one or more extra `k`** (`weekk`, `weekkk`, …). Regex for method names: `HasCompactWeekk+Suffix` (does **not** match `HasCompactWeekSuffix`) and `ContainsSpacedSlashWeekk+Token` (does **not** match `ContainsSpacedSlashWeekToken` if that exact name exists).
- Extra-vowel farm `weeeeek` / `ContainsSpacedSlashWeeeeek` if present (already beyond the finite `weel` keep row).

Leave hour/day/month matchers untouched.

## What to build

1. Deliverable — new file `docs/library/AZURE_WEEK_UOM_KEEP_LIST.md`:
   - Keep table (method name → token → why)
   - Delete table (method name → token → `week`+extra-`k` count)
   - Test-file delete glob list (path per row, or a glob plus exception list)
   - Count: methods to delete vs keep; test files to delete vs keep
   - One paragraph: historical ledger rows stay; do not rewrite `(proven)` text

2. Do **not** edit `AzureRetailPricesSkuMatchers.cs` or test files.

## Acceptance criteria

- Keep-list file exists; delete regex would not match `HasCompactWeekSuffix` or `SlashWeek`.
- Zero production code diffs.
- Counts are explicit so ABQ-48 can proceed without a second inventory.

## Constraints

- Working-tree safety on the new doc path (new file is safe).
- Do not invent TB/PD ids.
- Do not hunt. Do not “fix” by adding a matcher for a string found during inventory.
