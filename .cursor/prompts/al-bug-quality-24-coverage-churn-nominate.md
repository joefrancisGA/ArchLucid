# ABQ-24 — Coverage × churn zone nomination

**After ABQ-09 (shipped).** Do not replace `-Nominate`; **extend** it. Do not add coverlet to the PR `dotnet-fast-core` job (CI comments say PRs skip coverlet). Do not hunt.

## Goal

`-Nominate` can rank uncovered production files by **recent git churn × low test coverage × complexity proxy**, and print paste-ready unseeded zone stanzas for the top gaps. Agents still paste; the script still does not write the ledger.

## Why

ABQ-09 diffs churn against zone `paths` and lists gaps. It cannot tell a 2-line constant file from a 400-line orchestrator with no tests. ABQ-17’s nine ungated Pester suites were exactly “high value, zero CI.” Coverage×churn would have ranked them above cosmetic UI CSS.

## Context

- `scripts/agent/al-bug-pick-zone.ps1` — `Get-NominateGapReport`, `Write-NominatePreview`, `-Nominate`, `-Since`, `-SkipGit`, `-NominatePaths`
- `docs/library/AL_BUG_HUNT_LEDGER.md` § Nominate mode
- `.cursor/commands/al-bug.md` Phase 1.1a nominate pointer
- `scripts/tests/AlBugPickZone.Tests.ps1` — Pester 5 fixtures for nominate
- Coverlet is already referenced from many `*.Tests.csproj`; **do not** turn on `/p:CollectCoverage` in PR CI
- Complexity proxy: prefer **file length** (lines) or existing cyclomatic if a cheap tool exists — **do not** add a new metrics NuGet. Line count is enough for v1.

## What to build

1. **Coverage input (optional file):** `-CoverageCobertura <path>` or `-CoverageJson` from a **prior** `dotnet test --collect:"XPlat Code Coverage"` the owner ran locally/scheduled. If omitted, coverage multiplier is `1` (churn-only, today’s behavior) and preview notes `coverage: omitted`.

2. **Join:** for each nominate **gap** path, `rank = commitCount × (1 - coverageRatio) × log(1 + lineCount)` (or equivalent documented formula). Missing coverage → treat coverageRatio as `0` only when a coverage file was provided but the path is absent (uncovered); when no coverage file, do not pretend files are uncovered.

3. **Preview JSON:** keep `gaps` / `proposedZones`; add `rank`, `commitCount`, `coverageRatio` (nullable), `lineCount`. Sort proposed zones by rank descending. Cap still ~15.

4. **Docs:** ledger Nominate mode describes the optional coverage file and the formula. Command: one line “prefer `-Nominate` with coverage when a cobertuna/cobertura artifact exists; otherwise churn-only.”

5. **Do not** generate 200 micro-zones. Same paste-ready stanza format as ABQ-09.

6. Tests (inject coverage JSON + path list; `-SkipGit`):

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
```

Cases: no coverage file → rank order equals commitCount order; coverage file with path at 0% coverage outranks 100% coverage at same churn; test/docs paths still excluded; lineCount 0 does not NaN.

7. **CI:** do **not** add a coverlet collect step to PR workflows. Optional: document a scheduled/manual command in `docs/engineering/AGENTS.md` or the ledger How-to only.

## Acceptance criteria

- `-Nominate -Preview -SkipGit -NominatePaths …` still works without coverage.
- With a fixture coverage file, ranking changes as specified.
- PR CI time does not grow.
- No new zone stanzas pasted unless you also add **one** high-rank unseeded zone that is clearly uncovered in the fixture **and** still a gap on current `master` — default is **script only**; adding zones is optional and must not dump Core as a mega-zone.

## Constraints

- Do not recreate `archlucid-core`.
- Do not run `/al-bug`.
- Working-tree safety. Pester 5. Prefer concrete types. Check nulls.
- Coverlet output may be huge — parse only file-rate summaries, not line hits, if possible.
