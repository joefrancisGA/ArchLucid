# ABQ-23 — Analyzer-seeded hunt hypotheses (still hunt-ready gated)

**After ABQ-05 and ABQ-09 (shipped).** Do not lower the five-field hunt-ready bar. Do not auto-tick `(proven)`. Do not hunt product bugs in this session except as needed to wire the seeder.

## Goal

`/al-bug` seed hunts can ingest **compiler/analyzer warnings** (and optional checked-in SARIF) as **`(candidate)`** rows only. Promotion to `(hunt-ready)` still requires locus + input + wrong outcome + mechanism + **reachability** (ABQ-05). The picker never scores raw analyzer volume.

## Why

Hypotheses today come from the agent reading files. That undersamples nullability, unused-result, and CA/IDEx warnings that already fire in `dotnet build`. Using those diagnostics as **seeds** improves coverage of real defects without recreating the `beefAccessKey` treadmill: constructed inputs still fail 1.1b without a reachability citation.

## Context

- `.cursor/commands/al-bug.md` — Phase 1.1a seed hunt; 1.1b bar
- `.cursor/skills/al-bug/SKILL.md` — must stay aligned with the command
- `docs/library/AL_BUG_HUNT_LEDGER.md` — candidate vs hunt-ready; `-Nominate`
- `scripts/agent/al-bug-pick-zone.ps1` — hunt-ready count is a **tie-break only**; candidates must not lock ranking (keep this)
- Existing `.editorconfig` / analyzer packs on Core and UI — **re-grep**; do not add a new analyzer NuGet unless it is already in `Directory.Packages.props`

Do **not** require live CodeQL/GitHub Advanced Security in the agent VM. Optional `--SarifPath` for a file the owner already exported.

## What to build

1. **`scripts/agent/al-bug-seed-from-analyzers.ps1`** (Pester-testable functions in the same file or a `.psm1` sibling — one public entry):

   - Inputs: `-ZoneId`, `-LedgerPath` (default hunt ledger), `-ProjectPath` or zone `paths`, optional `-SarifPath`, `-Preview`.
   - Resolve zone `paths` from the ledger (reuse picker parse if you can dot-source without running pick; otherwise a small Python helper next to `al-bug-*.py`).
   - Collect diagnostics: prefer `dotnet build <csproj> /warnaserror- -clp:NoSummary` JSON logger **or** parse binary log **or** `dotnet build -p:ErrorLog=sarif`. Scope to files under the zone paths. Skip `*.Tests`, generated OpenAPI, `node_modules`.
   - Map each diagnostic to a **candidate** line: `[ ] (candidate) analyzer <id> at <path>:<line> — <message>` plus ` [class:other]` if ABQ-21 shipped, else omit class.
   - **Dedup** against existing open rows in that zone (same path+id). Cap **15** new candidates per run.
   - `-Preview` prints markdown; does **not** write the ledger (agents paste, same as `-Nominate`). Default does not edit the ledger.

2. **Command Phase 1.1a:** after reading zone files, the agent **may** run the seeder `-Preview` and paste candidates. Explicit: analyzer hits are **not** hunt-ready. Cheap-disproof 1.1c: “analyzer warning without reachable input” → `(invalid)` or leave candidate.

3. **Picker:** no new score term for analyzer count. Document that in the ledger Scoring “do not” sentence.

4. **UI/TS:** if a zone is `archlucid-ui/**`, you may call `npm exec eslint` **only** when `archlucid-ui/package.json` already has that script — do not add ESLint config in this prompt. If no script, skip UI and say so.

5. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugSeedFromAnalyzers.Tests.ps1'
```

Inject a fixture SARIF or diagnostic JSON (no `dotnet build` in unit tests). Assert: paths outside the zone dropped; tests/generated dropped; cap 15; dedup; preview does not require git.

6. Optional: one sample SARIF under `scripts/tests/fixtures/` (tiny, no secrets).

## Acceptance criteria

- Seeder `-Preview` on a fixture produces only `(candidate)` lines.
- Command/skill/ledger agree that analyzer seeds are not hunt-ready.
- Picker formula unchanged.
- No new analyzer package unless already pinned.

## Constraints

- Do not treat CA warnings as product bugs in this PR.
- Do not run `/al-bug` as a hunt.
- Working-tree safety. Pester 5. Check nulls.
- Claim discipline: analyzer noise is not “we found 200 security bugs.”
