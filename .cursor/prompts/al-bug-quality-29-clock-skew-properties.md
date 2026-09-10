# ABQ-29 — Time / clock-skew properties (windows, DST, DateTimeKind)

**After ABQ-19/22 (shipped).** Do not rewrite historical `bugs-found`. Do not hunt. Do not change the 90-day escape-rate formula’s *intent* — only lock its clock handling.

## Goal

Picker / rolling-stats / escape-log **window math** (24h, 7d, 90d) and Core/Application code that already takes `TimeProvider` have **properties** (FsCheck or equivalent) that stay correct across DST transitions, leap days, and `DateTimeKind` Unspecified vs UTC vs Local. Failures are off-by-one windows or silently dropping JSONL rows, not a new synonym allowlist.

## Why

Wave 4 found PowerShell `ConvertFrom-Json` turning ISO-8601 strings into **local** `[datetime]` values; `ConvertTo-RunLogUtcDateTime` had to accept both strings and `[datetime]`. That class of bug is invisible to example tests that pass `"2026-09-06T12:00:00Z"` as a string. Window boundaries (escape rate 90d, class saturation 14d, hit-rate cooldown) are the hunt loop’s scoring clocks — a DST skip can drop an escape or double-count a hunt.

## Context

Reuse:

- `scripts/agent/al-bug-pick-zone.ps1` — `ConvertTo-RunLogUtcDateTime`; 90d escape / hunt windows; class saturation 14d
- `scripts/agent/al-bug-rolling-stats.ps1` — 24h rolling log
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` / `AL_BUG_ESCAPE_LOG.jsonl`
- `scripts/tests/AlBugPickZone.Tests.ps1` — existing UTC fixtures
- `ArchLucid.TestSupport/FsCheckV3Compat.cs` + `FsCheckV3GlobalUsings.cs`
- Injected `TimeProvider` at `FindingsOrchestratorComposer`, `FindingDispositionService`, `RunExecuteOwnershipReconciliationService`, `OpenCommitmentFindingEngine` (grep `TimeProvider` — do not inject it into types that still call `DateTime.UtcNow` unless a property **fails**)
- ABQ-22 property style: `[FsCheck.Xunit.Property]` fully qualified; avoid `Gen.Elements` + `Prop.ForAll` CS0411; synonym-style tables can stay `[SkippableFact]` foreach loops

## What to build

1. **PowerShell clock helpers (Pester):** properties / theory-style cases for `ConvertTo-RunLogUtcDateTime`:

   - ISO string with `Z` → UTC.
   - `[datetime]` Kind Local (what `ConvertFrom-Json` produces) → converted to UTC, not used as-is.
   - Kind Unspecified treated as UTC **or** rejected — pick one, document it, test it. Do not mix.
   - Window membership: a hunt at `now - 90d + 1s` is in the 90d window; `now - 90d - 1s` is out (use a fixture `-AtUtc`).
   - DST: construct timestamps around a known US DST spring-forward instant **as UTC strings** so the test is timezone-independent on Cloud Linux. The bug to catch is local Kind leaking into subtraction.

2. **Optional C# properties** (only if cheap; one type per file) on a **single** already-`TimeProvider`-injected expiry/window helper (e.g. `ListExpiredRunIdsAsync` cutoff, waiver expiry, 24h digest). Property: `utcNow` vs `utcNow + 24h` never classifies the same absolute timestamp as both in-window and expired. Skip types that still hard-code `TimeProvider.System` unless you are already editing them for a failing probe — do not inject clocks repo-wide in this prompt.

3. **`/al-bug`:** no new phase. Ledger Scoring: one sentence that window math is UTC. Picker unchanged except bugfixes proven by the new tests.

4. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'
```

If you add Core/Application properties:

```text
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter FullyQualifiedName~Clock
```

(or the Application.Tests project you actually touched).

Fixtures: (a) JSONL line `at` as ISO Z vs the same instant as a local DateTime object — both count in the same 90d bucket; (b) leap-day `2024-02-29T00:00:00Z` plus 365d does not throw; (c) malformed `at` is skipped/logged, not a terminating parse of the whole log (match current behavior; do not newly fail CI on one bad line unless that is already the linter’s job).

## Acceptance criteria

- `ConvertTo-RunLogUtcDateTime` behavior is specified for string **and** `[datetime]` inputs, with Pester.
- 90d / 24h / 14d membership has at least one boundary pair each.
- No historical ledger rewrite. No picker score-weight change except clock-correctness.
- No `ConfigureAwait(false)` in tests. FsCheck properties use the ABQ-22 invocation pattern.

## Constraints

- Do not add English-phrase signals to the validity audit.
- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Pester 5. Concrete types over `var`. Check nulls.
- Cloud image is Linux — do not assume `Eastern Standard Time` is installed; use UTC fixtures.
