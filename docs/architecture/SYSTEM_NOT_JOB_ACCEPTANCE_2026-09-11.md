> **Scope:** Contributor-reference — wave 25 (SN-001–SN-040) close-audit evidence for system-not-job (the architecture is the object; review is a job). Not buyer-facing copy.

# System-not-job wave close audit (SN-040)

> **Date:** 2026-09-11 (wave 25 — SN-001–SN-040)  
> **Owner decision:** Working architects own a **system** on the desk; spawn-locked drafts are not a second Career editor. Compare stays committed-manifest; labeled envelope runs and clone-from-snapshot are the cheap sketch path (ADR **0092**). `DraftRequests` and `Runs` remain two kernels (ADR **0068**). Host `AgentExecution:Mode` default stays **Simulator** (no G-REAL-06).  
> **Spine:** [ADR 0092](adrs/0092-working-cheap-what-if-envelope.md) · [ADR 0068](adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md) · [`.cursor/prompts/system-not-job-00-index.md`](../../.cursor/prompts/system-not-job-00-index.md) · [SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md](SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** on this branch for Working production seats, subject to the residuals below. Spawn-locked drafts are not writable Career editors. Clone-from-snapshot is visible on the Working desk and command palette. Compare remains committed-manifest with labeled envelope runs as the allowed cheap path. Working Home lists desk children, not peer products. Kernels stay unmerged.

This audit does **not** claim insight-density engines closed, **G-REAL-06** Real-mode default, CPA SOC 2 (**G-REAL-05**), third-party pen-test publication (**G-ASSURANCE-02**), draft-to-draft Compare, or live presence avatars. ADR **0092** remains **Proposed** (contract + wiring shipped; formal ADR acceptance is a separate owner step).

## Done tests (owner checklist)

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | Spawn-locked draft is not a writable Career editor | **Yes** | `system-not-job-spawn-lock-not-writable.ts`; `SystemNotJobSn031VitestSpawnLockNotWritableArchitectureTests.cs`; `system-not-job-dual-editor-inventory.ts`; `SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md` |
| 2 | Clone-from-snapshot is visible on the Working desk | **Yes** | `system-not-job-clone-from-snapshot-entry.ts`; `system-not-job-palette-clone-new-version.ts`; `SystemNotJobSn008CloneFromSnapshotWorkingPathArchitectureTests.cs`; `SystemNotJobSn033PaletteCloneNewVersionArchitectureTests.cs`; `DraftCloneSnapshotCommand.cs` (SN-036) |
| 3 | Compare remains committed-manifest; labeled envelope runs allowed | **Yes** | `SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY.md`; `system-not-job-compare-gate-inventory.ts`; `SystemNotJobSn006CompareGateInventoryArchitectureTests.cs`; `SystemNotJobSn014CompareLabeledEnvelopeRunsArchitectureTests.cs` |
| 4 | Working Home is not two peer start products | **Yes** | `system-not-job-desk-children-not-peer-products.ts`; `SystemNotJobSn017DeskChildrenNotPeerProductsArchitectureTests.cs`; `SystemNotJobSn020NoSecondStartCtaWorkingArchitectureTests.cs` |
| 5 | Kernels unmerged (`DraftRequests` / `Runs`) | **Yes** | `system-not-job-no-merge-kernels-ratchet.ts`; `SystemNotJobSn034NoMergeKernelsRatchetArchitectureTests.cs`; `system-not-job-adr-guard.test.ts` (ADR 0068) |

## Cluster evidence

| Cluster | Prompts | Shipped? | Primary evidence | Residual |
|---------|---------|----------|------------------|----------|
| Kernel ADR + inventories | SN-001–007 | **Yes** | ADR 0092; `system-not-job-adr-guard.test.ts`; `SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md`; `SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY.md` | ADR 0092 **Proposed** |
| Desk object / clone | SN-008–030 | **Yes** | SN-008–030 architecture tests; desk-bound Ask/Graph/Search; portfolio resume; in-flight on desk | Cheap envelope **runner** → **CE** wave |
| Ratchets / contract / CLI | SN-031–036 | **Yes** | SN-031 spawn-lock Vitest; SN-034 kernel ratchet; SN-036 CLI clone honesty | SN-035 OpenAPI ratchet on open PR if not merged |
| Out-of-wave | SN-038–039 | **N/A** | [`SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md`](SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md) | Draft-diff Compare and live presence **not shipped** |
| Close | SN-037, SN-040 | **Yes** | `system-not-job-prompt-inventory.test.ts`; this file | Wave ends at SN-040 |

## Prompt inventory

All **40** paste-ready files under `.cursor/prompts/system-not-job-*.md` plus `system-not-job-00-index.md` are present. Vitest ratchet: `archlucid-ui/src/lib/system-not-job-prompt-inventory.test.ts` (SN-037).

## Residuals (out of wave / successor waves)

| Item | Tracking | Notes |
|------|----------|-------|
| ADR **0092** formal **Accepted** status | SN-001 | ADR remains **Proposed**; UI + C# wiring implements the decision |
| Sealed-record Governance list / desk IA | **DI** wave | Sealed-record inventory is a successor prompt set, not SN |
| Cheap envelope **runner** full mount | **CE** wave | ADR 0092 contract shipped; runner mounts in cheap-exploration |
| Draft-to-draft Compare | R12 / **SN-038** | Explicit skip — committed-manifest Compare only |
| Live presence / finding-comment chat | ADR 0090 / **SN-039** | LW-089 work-lease only; collab strip stays history |
| G-REAL-06 Real-mode default host config | GTM | Do not flip `AgentExecution:Mode` |
| Insight density / `DeterministicInsightDensityGate` | DX backlog | No 40th engine; `typed-engine-protected` unchanged |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | TB-135/TB-136 tech Done; GTM owner work open |
| GTM cohorts M-90 / M-44 / M-91 / M-92 | GTM V1.1 | Not assessment engineering batches |
| `MUTATION_UNDO_WINDOW_SECONDS = 300` | unchanged | Owner decision — not lengthened |

## Do not claim

- Draft-diff Compare shipped in system-not-job wave 25 (**SN-038**).
- Live presence avatars, cursors, occupancy heartbeats, or finding-comment chat shipped (**SN-039**).
- **Insight density** engines closed or a 40th coverage engine added.
- **CPA SOC 2** attestation or published third-party pen test.
- **G-REAL-06** executed or host `AgentExecution:Mode` default moved to Real.
- Spawn-locked draft is a writable Career editor at a new call site without adding ratchet coverage.
- `DraftRequests` and `Runs` merged into one kernel/table.

## Verification commands (focused)

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/system-not-job-prompt-inventory.test.ts \
  src/lib/system-not-job-close-audit.test.ts \
  src/lib/system-not-job-out-of-wave-residuals.test.ts \
  src/lib/system-not-job-adr-guard.test.ts \
  src/lib/system-not-job-spawn-lock-not-writable.test.tsx \
  src/lib/system-not-job-no-merge-kernels-ratchet.test.ts \
  src/lib/system-not-job-compare-gate-inventory.test.ts \
  src/lib/system-not-job-desk-children-not-peer-products.test.ts \
  src/lib/system-not-job-clone-from-snapshot-entry.test.ts
```

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj \
  --filter 'FullyQualifiedName~SystemNotJobSn'
```

## Related

- [CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md](CAREER_GRAVITY_ACCEPTANCE_2026-09-11.md) — wave 24 predecessor; Career/Rehearsal gravity
- [LOST_WRITE_ACCEPTANCE_2026-09-11.md](LOST_WRITE_ACCEPTANCE_2026-09-11.md) — wave 23 concurrent desk without presence (LW-089 lease)
- [SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md](SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md) — SN-038/039 skips
- [SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md](SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md) — spawn-lock dual-editor surfaces
- [SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY.md](SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY.md) — committed-manifest Compare gates
