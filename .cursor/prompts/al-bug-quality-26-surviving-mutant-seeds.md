# ABQ-26 — Surviving-mutant hunt seeds (ABQ-25 follow-on)

**After ABQ-23 and ABQ-25 (shipped).** Do not run `dotnet stryker` inside `/al-bug`. Do not raise `thresholds.break`. Do not lower the ABQ-05 hunt-ready bar. Do not hunt.

## Goal

A script can parse an **already-produced** Stryker `mutation-report.json` (scheduled artifact or a checked-in fixture) and emit paste-ready **`(candidate)`** ledger rows for **surviving** mutants, scoped to a hunt zone. Agents may paste those rows during a seed hunt. Promotion to `(hunt-ready)` still requires locus + input + wrong outcome + mechanism + **reachability**.

## Why

ABQ-25 maps scheduled Stryker **scores** onto zones (display-only). A 22.5% kill rate on `ApplicationCommitCriticalPaths` tells the picker “tests are weak” but does not name a place to look. Surviving mutants **are** named places: `NegateCondition at Foo.cs:42 survived`. That is the same seed quality as ABQ-23 analyzer diagnostics, with a stronger signal (the existing test suite did not catch the mutation).

## Context

Reuse; do not duplicate parsers:

- `scripts/agent/al-bug-seed-from-analyzers.ps1` — paste-ready `(candidate)` preview; **do not write the ledger**; cap + dedup
- `scripts/agent/al-bug-stryker-zone-map.json` — label → mutate globs → zone `paths`
- `scripts/ci/stryker-baselines.json` — scores only; **not** a mutant list
- `docs/library/MUTATION_TESTING_STRYKER.md` — reports are `StrykerOutput/**/mutation-report.json` (mutation-testing-elements schema)
- `.github/workflows/stryker-scheduled.yml` — scheduled matrix; uploads `StrykerOutput`
- `.cursor/commands/al-bug.md` Phase 1.1a — analyzer seeder already optional; add mutant seeder the same way
- `docs/library/AL_BUG_HUNT_LEDGER.md` — candidate vs hunt-ready; ABQ-05 Reachability

Do **not** require a live Stryker run in the agent VM. Input is a file path (`-ReportPath`) the owner already exported, or a tiny checked-in fixture under `scripts/tests/fixtures/`.

## What to build

1. **`scripts/agent/al-bug-seed-from-surviving-mutants.ps1`** (name may vary; keep `al-bug-` prefix). Pester-testable functions in the same file or a `.psm1` sibling — one public entry:

   - Inputs: `-ZoneId`, `-LedgerPath`, `-ReportPath` (required), `-Preview` (default: preview-only, **do not write the ledger**), optional `-StrykerLabel`.
   - Parse `mutation-report.json`. Keep only mutants whose status is **Survived** (schema field names vary — detect `status` / `mutantStatus` and document the mapping in a comment). Skip Killed / Timeout / CompileError / NoCoverage.
   - Join file path + line to ledger zone `paths` (reuse picker / `al_bug_ledger.map_paths_to_zone_ids` / ABQ-23 zone resolution). If `-ZoneId` is set, drop mutants outside that zone.
   - Emit markdown lines: `[ ] (candidate) mutant #<id>: <mutator> at <path>:<line> survived — <replacement or description>` plus ` [class:other]` (or a better closed class **only** when obvious, e.g. negated condition near an authz check → `authz-scope`; default `other`). Cap **15** new candidates per run. Dedup against existing open rows in that zone (same path+line+mutator).
   - `-Preview` prints paste-ready markdown; does **not** edit the ledger.

2. **Command Phase 1.1a:** after the analyzer seeder sentence, add: the agent **may** run this seeder `-Preview` when a `mutation-report.json` is already on disk (scheduled artifact download, not a live Stryker run). Explicit: surviving mutants are **not** hunt-ready. Cheap-disproof 1.1c: “mutant survived but the production path is unreachable / equivalent mutant” → leave candidate or `(invalid)`.

3. **Picker:** no new score term for surviving-mutant count. Do **not** treat a surviving mutant as a proven bug. ABQ-25 display-only mutation score stays as-is.

4. **CI:** optional Pester only. Do **not** add a Stryker step to `azure-extractor-pester` or `/al-bug`. Do not download GitHub artifacts from this prompt.

5. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugSeedFromSurvivingMutants.Tests.ps1'
```

Fixture JSON (minimal mutation-testing-elements snippet, not a full report):

- (a) one Survived mutant under `ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs` → one candidate line with path + line + mutator.
- (b) Killed mutant in the same file → omitted.
- (c) Survived mutant under `archlucid-ui/` when `-ZoneId` is an Application zone → omitted.
- (d) duplicate path+line+mutator already in a fixture ledger snippet → not re-emitted.
- (e) missing `-ReportPath` / malformed JSON → non-zero exit, no ledger write.

## Acceptance criteria

- Preview-only by default; ledger unchanged unless a human pastes.
- Hunt-ready bar (ABQ-05) is not weakened. Command text says mutants are candidates only.
- No `dotnet stryker` in `/al-bug` or PR CI.
- Unmapped / UI / script zones with no report simply produce zero candidates (not a fake `0%` hunt).

## Constraints

- Do not recreate `_al-bug-pick-zone.ps1`.
- Do not add English-phrase signals to `al-bug-audit-proven-rows.py`.
- Do not run `/al-bug`. Do not invent `PD-###` / `TB-###`.
- Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92.
- Working-tree safety. Pester 5 (`Should -Be`, `BeforeAll`). Check nulls.
- Default hunt push target remains `bugsmash`.
