# ABQ-49 — Delete synthetic `weekk+` UOM tests

**After or with ABQ-48.** Do not reintroduce deleted matchers to make tests green. Do not run `/al-bug`. Topology hunts stay paused until this PR is merged.

## Goal

Remove test files that only assert `LooksLikeConsumptionUsd` is true for `10weekkk…` / `10 / weekkk…`. Keep tests for ABQ-47 keep-list tokens (`SlashWeek`, `CompactWeekWord`, `BoundedWk`, etc.).

## Why

~200 `AzureRetailPricesSkuMatchersWeekk+Tests.cs` / `SpacedSlashWeekk+Tests.cs` files exist solely to lock the farm. After ABQ-48 they fail or compile against missing methods. Deleting them is the cleanup, not a coverage loss: those inputs are not product behavior.

## Context

- `ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchers*.cs`
- Delete list from `docs/library/AZURE_WEEK_UOM_KEEP_LIST.md`
- Production already cleaned in ABQ-48 (or this session includes 48)

**Delete globs (confirm against keep-list before `git rm`):**

- `AzureRetailPricesSkuMatchersWeekk*Tests.cs` **except** names that are exactly keep-list (`WeekWord`, `WeeksWord`, `Weekes` if keep-listed). **Do not** delete `AzureRetailPricesSkuMatchersSlashWeekTests.cs` (token `Week` not `Weekk`).
- `AzureRetailPricesSkuMatchersSpacedSlashWeekk*Tests.cs` (extra `k` after `Week`)
- `AzureRetailPricesSkuMatchersCompactWeekk*Tests.cs` when the token is extra-`k`
- Extra-vowel files on the delete list (`Weeeeek`, …)

If a filename is ambiguous, open it: delete when `InlineData` is only `10week`+extra `k`s or `10 / week`+extra `k`s.

## What to build

1. `git rm` the delete-list test files (do not leave empty stubs).
2. Grep `ArchLucid.Core.Tests` for `weekkk` / `weekkkkk` literals; none remain except comments in the keep-list doc.
3. Tests:

```text
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AzureRetailPricesSkuMatchers' -v q
```

Must be green. Spot-check keep-list: `SlashWeek`, `CompactWeekWord` / `CompactWeeksWord`, `BoundedWk` still present and passing.

4. Optional scoped compile of Core.Tests if 48 landed in the same tree.

## Acceptance criteria

- No test file whose sole purpose is extra-`k` week UOM.
- Remaining matcher tests pass.
- Matcher production file still has no extra-`k` methods (if 48 was separate, rebase onto it).

## Constraints

- Working-tree safety. Do not `git add -A`.
- Do not delete hour/day/month matcher tests.
- Do not rewrite historical ledger rows that cite deleted test class names (ABQ-46 already said history stays).
- Do not hide workspace tabs. No GTM/TB-135 work.
