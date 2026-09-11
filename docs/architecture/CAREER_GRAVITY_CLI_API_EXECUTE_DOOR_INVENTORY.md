> **Scope:** Shrink-only inventory — CLI verbs and API execute/finalize paths that have no Career/Rehearsal door and can emit unlabeled Simulator results. **Do not change CLI in this file.** CG-054/055 own mutations.

> **Spine:** ADR **0091** · ADR **0033** · ADR **0086** · AS-083 · CG-005

# Career-gravity CLI/API execute-without-door inventory

**Last reviewed:** 2026-09-11

UI doors do not bind curl. Livelihood packets leave through CLI/API.

**Do not change CLI** here (CG-054 / CG-055). `archlucid try --rehearse | --real` already shipped (AS-083). This inventory names remaining unlabeled execute/finalize exits.

## Mode vs door

| Concept | Owner | Notes |
|---------|-------|-------|
| Host `AgentExecution:Mode` | Host config (default **Simulator**) | ADR 0086 / 0091 — **do not** flip to Real (no G-REAL-06) |
| Structural execution mode on the run | Execute pipeline | Simulator / Real / Fallback / Mixed |
| Working Career / Rehearsal door | UI chrome (`localStorage` until CG-011) | **Not** an API header on generic execute |
| `X-ArchLucid-Pilot-Try-Real-Mode: 1` | ADR 0033 `try --real` smoke | Audit + counters; **not** a Rehearsal door |

## CLI verbs

| Verb / entry | Mode source | Door awareness | Honesty header / stdout | Leak class | Owner |
|--------------|-------------|----------------|-------------------------|------------|-------|
| `archlucid try` (no `--real`) | Host Mode; smoke forwards `--allow-simulator` | **Default Rehearsal** (`TryCommandOptions.Door`) | Help copy: default is Rehearsal not Career | default-rehearsal | CG-055 leftover if unflagged try still prints Career-complete |
| `archlucid try --rehearse` | `--allow-simulator` | Explicit Rehearsal | Help documents Rehearsal | explicit-rehearse | CG-054 |
| `archlucid try --real` | Hosted Real path; local gate `ARCHLUCID_REAL_AOAI=1` | Explicit Career | `X-ArchLucid-Pilot-Try-Real-Mode` on smoke execute | explicit-career | ADR 0033 |
| `archlucid real-mode smoke` | Staging/API host Mode | `--allow-simulator` / `--rehearse` alias | Career path = omit `--rehearse` on `--staging` | explicit when flagged | CG-054 |
| `ArchLucid.Cli/ArchLucidCliApiClient.Runs.ExecuteCommit.cs` `ExecuteRunAsync` | Host Mode | **None** — `ExecuteAsync(runId, null)` | No door header | **none** | CG-054 |
| Same file `CommitRunAsync` | Host Mode | **None** — `FinalizeAsync` | No door header | **none** | CG-021 / CG-054 |
| `DraftNewCommandIntakeLoop.cs` | Host Mode | None (client execute) | Unlabeled Simulator results if host is Simulator | **none** | CG-054 |
| `SecondRunCommand.cs` | Host Mode | None | Same | **none** | CG-054 |
| `GoldenCohortLockBaselineCommand.cs` / `GoldenCohortDriftCommand.cs` | Host Mode | None | Eval/CI — not Working Career | eval-ok | leave |
| `archlucid first-value-report` | N/A (download) | None | Honesty is API markdown | assumed-banner (CG-003) | CG-027 |
| `archlucid proof-packet` / `pilot proof-packet` | Deltas JSON mode | Caveat via `PilotProofPacketStructuralExecutionModeFormatter` | Sponsor caveat line | covered (caveat) | CG-027 / CG-045 |
| `archlucid buyer-proof-pack` / `sponsor-packet` | API first-value + PDF | None | Sponsor-circulation watermarks, not door | assumed-banner | CG-027 |

## API routes

| Route | Mode source | Door awareness | Honesty | Leak class | Owner |
|-------|-------------|----------------|-------------------------|------------|-------|
| `POST /v1/architecture/review/{runId}/execute` | Host `AgentExecution:Mode` | Pilot try-real **header only** (`IsPilotTryRealModeRequest`) | Run stamp / structural mode; no Career door | **none** (curl) | CG-054 |
| `POST …/execute/selective` | Host Mode | **No** try-real header | Same | **none** | CG-054 |
| `POST …/execute/async` | Host Mode | **No** door | 202 operation; same execute gravity | **none** | CG-054 |
| `POST …/finalize` | Host Mode + commit orchestrator | **No** door header | `MapForFinalize` blocks unlabeled Working Simulator (banner defaults false) | covered (finalize gate) / none (door) | CG-021 |
| UI execute buttons | UI door chrome | Chooser does not bind the HTTP body | Curl replay of the same route has no door | UI leftover | CG-011 / CG-019 |

## Quoteable gaps

1. **UI doors do not bind curl.** `POST review/{runId}/execute` has no Career/Rehearsal field. A Working architect on Career chrome can still execute Simulator via API while host Mode is Simulator.
2. **CLI generic execute** (`ArchLucidApiClient.ExecuteRunAsync`) sends no door. Only `try` / `real-mode smoke` know `--rehearse` / `--real`.
3. **`--rehearse` is an alias for `--allow-simulator` on smoke**, not a persisted run stamp. CG-019 (execute posture stamp) is the leftover for stamping the door on the run.
4. Finalize is **stricter** than export: `MapForFinalize` does not assume a rehearsal banner. Execute remains unlabeled without a door.

## Ratchet paths (must stay backtick-listed)

`ArchLucid.Cli/Commands/TryCommand.cs` · `ArchLucid.Cli/Commands/TryCommandOptions.cs` · `ArchLucid.Cli/Commands/TryCommandExecutionDoor.cs` · `ArchLucid.Cli/Commands/RealModeSmokeCommand.cs` · `ArchLucid.Cli/Commands/RealModeSmoke/RealModeSmokeExecuteRunProbe.cs` · `ArchLucid.Cli/ArchLucidCliApiClient.Runs.ExecuteCommit.cs` · `ArchLucid.Cli/Commands/DraftNewCommandIntakeLoop.cs` · `ArchLucid.Cli/Commands/SecondRunCommand.cs` · `ArchLucid.Cli/Commands/GoldenCohortLockBaselineCommand.cs` · `ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs` · `ArchLucid.Cli/Commands/PilotProofPacketStructuralExecutionModeFormatter.cs` · `ArchLucid.Cli/Commands/FirstValueReportCommand.cs` · `ArchLucid.Cli/Commands/ProofPacketCommand.cs` · `ArchLucid.Api/Controllers/Authority/RunsController.Execute.cs` · `ArchLucid.Api/Controllers/Authority/RunsController.AsyncOperations.cs` · `ArchLucid.Api/Controllers/Authority/RunsController.CommitReplayPin.Commit.cs` · `ArchLucid.Contracts/Pilots/PilotTryRealModeHeaders.cs`

## Shrink rules

1. **Do not change CLI** from this inventory (CG-054/055).
2. Do not add a host Mode flip. No G-REAL-06.
3. New unlabeled execute/finalize exits fail Vitest until listed.
4. Ratchet: `career-gravity-cli-api-execute-door-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host `AgentExecution:Mode` default Simulator.
- ADR 0033 `try --real` local gate.
- Golden-cohort CI execute (eval-ok).
