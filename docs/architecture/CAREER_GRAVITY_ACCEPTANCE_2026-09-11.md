> **Scope:** Contributor-reference — wave 24 (CG-001–CG-100) close-audit evidence for Career/Rehearsal **gravity** (unlabeled Simulator borrowing Career authority). Not buyer-facing copy.

# Career-gravity wave close audit (CG-100)

> **Date:** 2026-09-11 (wave 24 — CG-001–CG-100)  
> **Owner decision:** Working production default execute gravity is **Career**; Rehearsal is explicit; run **stamp** (structural Mode + door) is what exports read — not the live chooser alone. Host `AgentExecution:Mode` default stays **Simulator** (no G-REAL-06).  
> **Spine:** [ADR 0091](adrs/0091-career-is-working-default-day.md) · [ADR 0086](adrs/0086-working-career-vs-rehearsal-doors.md) · [`.cursor/prompts/career-gravity-00-index.md`](../../.cursor/prompts/career-gravity-00-index.md) · [CAREER_GRAVITY_COMPOSER_PROMPTS.md](CAREER_GRAVITY_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** on this branch for Working production seats, subject to the residuals below. Working **Career + Simulator** cannot finalize or export as Career-complete when honesty gates apply. Rehearsal runs carry watermarks, flags, or blocks on inventoried export surfaces. Execute posture **stamp** is persisted on the run and flows to outbound payloads. Guided/demo/trial still teach Simulator without the Working chooser. Host `AgentExecution:Mode` default is unchanged.

This audit does **not** claim live first-review cohort results (**M-90**), CPA SOC 2 (**G-REAL-05**), third-party pen-test publication (**G-ASSURANCE-02**), insight-density engines closed, **G-REAL-06** Real-mode default, or in-app changelog. ADR **0091** remains **Proposed** (contract + wiring shipped; formal ADR acceptance is a separate owner step).

## Done tests (owner checklist)

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | Working Career + Simulator cannot finalize as Career-complete | **Yes** | `shouldSuppressReadyToFinalizeForCareerHonesty`; `SimulatorCareerHonestyPresenter`; `CareerGravityCg021CareerBlocksFinalizeWhenSimulatorArchitectureTests.cs`; `run-pipeline-finalize-blocked-honesty.test.ts` |
| 2 | Exports watermarked or blocked on rehearsal / Simulator | **Yes** | `career-artifact-honesty.ts`; `CareerArtifactCompletenessValidator.cs`; `CareerGravityCg022`–`Cg028` architecture tests; `career-gravity-export-watermark-inventory.test.ts` |
| 3 | Run stamp (Mode + door) is what artifacts read | **Yes** | `CareerGravityCg019ExecutePostureStampArchitectureTests.cs`; OpenAPI run/export fields (CG-073); `CareerGravityCg093WebhookPayloadDoorArchitectureTests.cs` |
| 4 | Guided/demo/trial still teach Simulator | **Yes** | `working-career-rehearsal-guided-split.test.ts` (AS-081 / CG-052); `OPERATOR_UI_EXPERIENCE_MODES.md` Guided split |
| 5 | Host `AgentExecution:Mode` default unchanged | **Yes** | `career-gravity-adr-guard.test.ts`; AS-085 ratchet in `career-gravity-as076-leftover-matrix.test.ts`; door modules do not flip host Mode (CG-014 ratchet) |

## Cluster evidence

| Cluster | Prompts | Shipped? | Primary evidence | Residual |
|---------|---------|----------|------------------|----------|
| Kernel ADR + inventories | CG-001–010 | **Yes** | ADR 0091; `career-gravity-adr-guard.test.ts`; `CAREER_GRAVITY_*_INVENTORY.md` + Vitest ratchets | ADR 0091 **Proposed** |
| Door persist / stamp | CG-011–020 | **Yes** | `working-career-rehearsal-door-preference.ts`; CG-011–020 architecture tests; `CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY.md` | — |
| Career gates | CG-021–040 | **Yes** | `CareerGravityCg021`–`Cg029` architecture tests; `simulator-career-honesty.ts` | Grandfathered rows in inventories shrink-only |
| Watermarks | CG-041–055 | **Yes** | `career-gravity-export-watermark-inventory.ts`; CLI stdout honesty (CG-045) | — |
| Nested tools inherit | CG-056–070 | **Yes** | `career-gravity-nested-desk-door-inventory.test.ts`; `career-gravity-compare-ask-graph-search-inventory.test.ts` | Cheap what-if depth → **CE** wave |
| Ratchets | CG-071–080 | **Partial** | `career-gravity-unlabeled-ready-inventory.test.ts`; `run-pipeline-finalize-blocked-honesty.test.ts` | **CG-046 / CG-076** Playwright Ready/watermark E2E not in repo |
| Chrome / copy / ops | CG-081–097 | **Yes** | `CareerGravityCg090`–`Cg097` architecture tests; `OPERATOR_UI_EXPERIENCE_MODES.md` | CG-053 help expansion partial (CG-097 search aliases shipped) |
| Out-of-wave | CG-098 | **N/A** | [`CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md`](CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md) | In-app changelog **not shipped** |
| Close | CG-099–100 | **Yes** | `career-gravity-prompt-inventory.test.ts`; this file | Wave ends at CG-100 |

## Prompt inventory

All **100** paste-ready files under `.cursor/prompts/career-gravity-*.md` plus `career-gravity-00-index.md` are present. Vitest ratchet: `archlucid-ui/src/lib/career-gravity-prompt-inventory.test.ts`.

## Residuals (out of wave / successor waves)

| Item | Tracking | Notes |
|------|----------|-------|
| ADR **0091** formal **Accepted** status | CG-001 | ADR remains **Proposed**; UI + C# wiring implements the decision |
| Playwright Ready / export watermark E2E | CG-046 / CG-076 | Vitest + C# gates shipped; no `@release-gate` Playwright ratchet in repo |
| In-app changelog / What's new | Product backlog | **CG-098** explicit skip (LW-100 residual) |
| G-REAL-06 Real-mode default host config | GTM | Do not flip `AgentExecution:Mode` |
| Insight density / `DeterministicInsightDensityGate` | DX backlog | No 40th engine; `typed-engine-protected` unchanged |
| Cheap what-if / draft-diff Compare | **CE** / **SN** waves | Successor livelihood-gravity prompts |
| Mode-matrix collapse / sealed-record home | **MG** / **DI** waves | Successor prompts |
| Daytime wait / Gate 1 live review | **DW** / **LN** waves | Successor prompts |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | TB-135/TB-136 tech Done; GTM owner work open |
| GTM cohorts M-90 / M-44 / M-91 / M-92 | GTM V1.1 | Not assessment engineering batches |
| Live presence / finding-comment chat | out of product | ADR 0037 / 0090 |
| `MUTATION_UNDO_WINDOW_SECONDS = 300` | unchanged | Owner decision — not lengthened |

## Do not claim

- **Ready** on Working Simulator can be screenshot without suppression when honesty options are not wired at a new call site — inventories shrink-only; add ratchet when touching.
- **Playwright** `@release-gate` rehearsal Ready/watermark coverage exists (CG-046 / CG-076).
- **Insight density** engines closed or a 40th coverage engine added.
- **CPA SOC 2** attestation or published third-party pen test.
- **G-REAL-06** executed or host `AgentExecution:Mode` default moved to Real.
- **Live first review** cohort (**M-90**) or procurement rehearsal (**M-91**) ran.
- In-app **What's new** / changelog shipped in career-gravity wave 24.

## Verification commands (focused)

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/career-gravity-prompt-inventory.test.ts \
  src/lib/career-gravity-close-audit.test.ts \
  src/lib/career-gravity-adr-guard.test.ts \
  src/lib/career-gravity-unlabeled-ready-inventory.test.ts \
  src/lib/career-gravity-export-watermark-inventory.test.ts \
  src/lib/career-gravity-outbound-inventory.test.ts \
  src/lib/career-gravity-out-of-wave-residuals.test.ts \
  src/lib/career-artifact/career-artifact-honesty.test.ts \
  src/lib/governance/simulator-career-honesty.test.ts \
  src/lib/governance/working-career-rehearsal-guided-split.test.ts \
  src/lib/runs/run-pipeline-finalize-blocked-honesty.test.ts
```

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj \
  --filter 'FullyQualifiedName~CareerGravityCg'
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj \
  --filter 'FullyQualifiedName~CareerArtifactCompletenessValidatorTests'
```

## Related

- [ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md](ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md) — wave 22 predecessor; AS-076–085 doors
- [LOST_WRITE_ACCEPTANCE_2026-09-11.md](LOST_WRITE_ACCEPTANCE_2026-09-11.md) — wave 23 concurrent desk without presence
- [LIVELIHOOD_PROOF_ACCEPTANCE_2026-09-08.md](LIVELIHOOD_PROOF_ACCEPTANCE_2026-09-08.md) — wave 20 Simulator career incompleteness (LP-06)
- [CAREER_GRAVITY_AS076_LEFTOVER_MATRIX.md](CAREER_GRAVITY_AS076_LEFTOVER_MATRIX.md) — do not re-run AS-076–085 bodies
- [CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md](CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md) — CG-098 skips
