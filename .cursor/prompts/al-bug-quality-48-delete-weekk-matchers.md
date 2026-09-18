# ABQ-48 — Delete synthetic `weekk+` production matchers

**After ABQ-47 keep-list exists.** Do not delete test files here (ABQ-49). Do not add replacement `weekk+` methods. Do not run `/al-bug`. Do not ship topology hunts in this PR.

## Goal

Remove farmed `weekk+` / spaced-slash ` / weekk+` branches from `IsWeekMeter` so costing only recognizes the ABQ-47 keep-list. `LooksLikeConsumptionUsd` must still return true for `1 Week`, `1/Week`, `10week`, `1 wk` (keep-list tokens).

## Why

Each extra `k` was a hunt-manufactured input. The methods exist only so `LooksLikeConsumptionUsd` returns true for strings Azure never sends. They bloat `AzureRetailPricesSkuMatchers.cs` (thousands of lines of near-copies) and make later real UOM work unreviewable.

## Context

- Production: `ArchLucid.Core/Costing/AzureRetailPricesSkuMatchers.cs`
- Keep-list: `docs/library/AZURE_WEEK_UOM_KEEP_LIST.md` (create it in ABQ-47 first; if missing, **stop** and do 47 — do not invent a keep-list in this session)
- Tests that still reference deleted methods will fail until ABQ-49. **This prompt may leave Core.Tests red** if 48 and 49 are split PRs. Prefer **one PR for 48+49** if the implementer can finish both in one session; if split, 48’s PR description must say tests land in 49 immediately after.

## What to build

1. Delete every `private static bool` whose name matches `HasCompactWeekk+Suffix` or `ContainsSpacedSlashWeekk+Token` (extra `k` after `Week`). Remove their `||` chain entries in `IsWeekMeter`.
2. Delete extra-vowel methods on the ABQ-47 delete list (`Weeeeek`, etc.).
3. Do **not** rewrite keep-list methods “for style” unless a call is broken. Do **not** merge keep-list helpers into one mega-regex in this prompt (that is a later design change, not this cleanup).
4. Do **not** add a generic `StartsWith("week")` / `Contains("week")` that would accept `weekk+` again. Boundary behavior for **keep** tokens stays: `week` must not match as a prefix of `weekk` **because `weekk` is deleted**, not because we still special-case 70 lengths.
5. After deletion, grep the production file: zero `HasCompactWeekkSuffix` (one extra k) through unbounded `k` runs. `HasCompactWeekSuffix` / `HasCompactWeeksWordSuffix` / `HasCompactWeekWordSuffix` must remain if they were keep-listed.
6. Scoped compile: `dotnet build ArchLucid.Core/ArchLucid.Core.csproj`. Full `dotnet test` on Core.Tests is **ABQ-49** unless this session also completes 49.

## Acceptance criteria

- Production matcher file has no `week`+extra-`k` methods.
- Keep-list tokens still have a code path (spot-check by reading `IsWeekMeter`; do not add new tests here).
- No new UOM synonyms. No `/al-bug` ledger tick.

## Constraints

- Working-tree safety on the matcher file.
- Each remaining helper stays in this partial class file (do not split the file in this prompt).
- No `ConfigureAwait(false)` (N/A unless you add tests — you should not).
- Do not mass-edit the hunt ledger.
- Do not commit untracked `ship-hunts-*.py` unless ABQ-50 is in the same PR **and** those scripts are already tracked (they are usually untracked — leave them untracked).
