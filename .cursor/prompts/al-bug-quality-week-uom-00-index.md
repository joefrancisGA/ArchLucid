<!-- Wave 7 — synthetic Azure week UOM letter-run cleanup.
     Origin: 2026-09-15 owner: stop shipping weekk+ hunts; cleanup before
     further /al-bug batches. Topology hunts OK after this set lands.
     Do not implement from this index. Paste one ABQ-46–50 file per session. -->

# `/al-bug` quality — Wave 7 (`weekk+` UOM treadmill)

**Status:** **prompts only** (2026-09-15). Do **not** implement from this file.

Owner: stop new compact/spaced-slash `week`+extra-`k` matcher hunts. Delete the farmed methods and tests. Ban reintroduction in CI. **Do not** start another core-costing `weekk+` hunt batch. Topology-proposal-merge hunts may continue **now** on their own branches; do not mix new topology hits into the matcher-deletion PR (48/49).

**Do not treat this as a V1 assessment scorecard.** Do not add GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**. Do not run `/al-bug` to implement 46–50.

## Diagnosis

| Class | Failure | Prompts |
|-------|---------|---------|
| **UOM letter-run treadmill** | `IsWeekMeter` allowlist + letter-boundary made `10weekk` a new “hit”; hunts appended `k`s through 70+ | 46 stop-ship, 47 inventory, 48 delete matchers, 49 delete tests, 50 CI ban |

## Run order

| # | Prompt file | Flaw it mitigates |
|---|----------------|-------------------|
| **46** | `al-bug-quality-46-stop-weekk-uom-farming.md` | Docs/command/skill: not hunt-ready; no new methods |
| **47** | `al-bug-quality-47-week-uom-keep-list.md` | Keep vs delete inventory (`AZURE_WEEK_UOM_KEEP_LIST.md`) |
| **48** | `al-bug-quality-48-delete-weekk-matchers.md` | Remove farmed methods from `AzureRetailPricesSkuMatchers.cs` |
| **49** | `al-bug-quality-49-delete-weekk-tests.md` | Remove farmed test files |
| **50** | `al-bug-quality-50-ban-weekk-uom.md` | CI grep + ship-script hygiene |

**48+49 may be one PR.** 47 before 48. 50 after 48/49 (otherwise the ban fails on current `bugsmash`). **46 can land first** so agents stop shipping while cleanup is in progress.

## Keep (preview — ABQ-47 locks the table)

Keep finite Azure-plausible tokens: `week`/`weeks`, `wk`/`wks`, slash and spaced-slash forms, compact digit+`week`, and **already-in-tree** short typos (`wek`, `wel`, `weel`, `weekes`). **Delete** `week`+one or more extra `k`s and extra-vowel `weeeeek`.

## Won’t do

- Mass-retcon ledger `(proven)` rows that cite deleted test class names.
- Ban topology `ds-` / `azurerm_*` short tokens (owner continues those hunts now, on separate branches).
- Rewrite hour/day/month UOM matchers.
- Commit untracked `scripts/agent/ship-hunts-*.py` solely to delete `CORE_COMPACT` maps.
- Grow the ABQ-21 closed defect-class enum just for this farm (50 uses CI grep).

## Global constraints

Same as [al-bug-quality-00-index.md](al-bug-quality-00-index.md) global constraints. Working-tree safety. No `/al-bug`. No `/fix-ci`. Stage only paths the pasted prompt names.
