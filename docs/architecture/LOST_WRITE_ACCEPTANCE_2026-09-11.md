> **Scope:** Contributor-reference — wave 23 (LW-001–LW-100) close-audit evidence for fail-closed in-flight livelihood writes on the Working architect desk. Not buyer-facing copy.

# Lost-write wave close audit (LW-100)

> **Date:** 2026-09-11 (wave 23 — LW-001–LW-100)  
> **Owner decision:** Fail-close **in-flight writes** so a Working architect cannot silently lose or overwrite work. ADR **0088** (draft PATCH CAS mandatory unless `forceOverwrite`); ADR **0089** (401 resume with `localStorage` for inventoried livelihood mutates); ADR **0090** (architecture work-lease without live presence).  
> **Spine:** [ADR 0088](adrs/0088-draft-patch-cas-mandatory.md) · [ADR 0089](adrs/0089-livelihood-mutation-401-resume.md) · [ADR 0090](adrs/0090-architecture-work-lease-without-presence.md) · [`.cursor/prompts/lost-write-00-index.md`](../../.cursor/prompts/lost-write-00-index.md) · [LOST_WRITE_COMPOSER_PROMPTS.md](LOST_WRITE_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** on this branch for Working production seats, subject to the residuals below. Omit-token draft PATCH returns **409** (`draft_cas_token_missing`), not last-write-wins. Offline replay carries `expectedUpdatedUtc` and surfaces **Keep mine** on 409 without dequeuing. 401 pending livelihood mutations survive tab close in **`localStorage`** and replay with the same idempotency key. Governance approval rationale is in the livelihood document-guard inventory. Sibling operator tabs receive **`auth-cleared`** and stop writing. The work-lease banner is honest server-backed lease chrome — not live presence.

This audit does **not** claim live presence, insight density engines closed, CPA SOC 2 (**G-REAL-05**), third-party pen-test publication (**G-ASSURANCE-02**), or **G-REAL-06** Real-mode default / Simulator→Real host flip. ADRs **0088**, **0089**, and **0090** remain **Proposed** (contract + wiring shipped; formal ADR acceptance is a separate owner step).

## Done tests (owner checklist)

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | Omit-token draft PATCH does **not** 200; `forceOverwrite` is explicit and audited | **Yes** | `DraftPatchStaleUpdatedUtcGuardTests.cs`; `LostWriteDraftCasArchitectureTests.cs`; `lost-write-patch-draft-cas-ratchet.test.ts`; OpenAPI snapshot `draft_cas_token_missing` |
| 2 | Offline replay sends `expectedUpdatedUtc`; 409 → Keep mine; v1 queue never omit-token PATCH | **Yes** | `architecture-draft-offline-queue-replay.test.ts`; `LOST_WRITE_OFFLINE_QUEUE_CAS.md`; `lost-write-inventories.test.ts` (LW-006) |
| 3 | 401 pending survives tab close (`localStorage`); FP row versions intact on bulk replay | **Yes** | `livelihood-mutation-401-resume.test.ts` (LW-067); `lost-write-401-resume-call-site-guard`; `lost-write-browser-wip-inventory.ts` |
| 4 | Approval rationale guarded; programmatic `router.push` prompts when dirty | **Yes** | `livelihood-document-guard-guard.test.ts` (LW-071); `governance-approval-rationale-unsaved.test.ts` (LW-072) |
| 5 | Sibling tab receives **auth-cleared**; scope broadcast refreshes desk | **Yes** | `SessionIdleTimeoutGuard.test.tsx` (LW-084); `session-idle-broadcast.test.ts` |
| 6 | Work-lease banner is not presence; steal confirmed and audited; CAS still required | **Yes** | `ArchitectureDraftWorkLeaseBanner.test.tsx`; `architecture-draft-work-lease-copy.test.ts`; `DraftRequestsControllerWorkLeaseTests.cs`; `LostWriteLw089ArchitectureWorkLeasesDdlArchitectureTests.cs` |

## Cluster evidence

| Cluster | Prompts | Shipped? | Primary evidence | Residual |
|---------|---------|----------|------------------|----------|
| Kernel ADR + inventories | LW-001–012 | **Yes** | ADRs 0088–0090; `lost-write-adr-guard.test.ts`; `lost-write-inventories.test.ts`; `LOST_WRITE_CAS_COMPAT.md` | ADRs remain **Proposed** |
| Server fail-closed CAS | LW-013–028 | **Yes** | `DraftPatchStaleUpdatedUtcGuard.cs`; `DraftRequestMutateStageCasForwardTests.cs`; `MicrosoftOpenApiDraftPatchCasDocumentTransformerTests.cs` | Grandfathered omit-token clients outside repo must upgrade |
| Online UI ratchet | LW-029–035 | **Yes** | `use-architecture-draft-autosave.test.ts`; `architecture-draft-patch-cas-online.ts`; `lost-write-patch-draft-cas-ratchet.test.ts` | None |
| Offline queue | LW-036–050 | **Yes** | `architecture-draft-offline-queue-replay.ts`; `architecture-draft-offline-queue-replay.test.ts`; v1 migration without omit-token PATCH | v1 queue entries migrated on read — not retroactive server repair |
| 401 resume | LW-051–070 | **Yes** | `livelihood-mutation-401-resume.ts`; `livelihood-mutation-401-resume-wrappers.ts`; `lost-write-401-resume-inventory.ts`; ratchet guards | GET routes excluded from resume wrapper (by design) |
| Dirty guards | LW-071–082 | **Yes** | `livelihood-document-guard-inventory.ts`; `governance-approval-rationale-*`; intake/rename rows documented | Intake wizard + identity rename remain partial (named in inventory) |
| Cross-tab | LW-083–088 | **Yes** | `session-idle-broadcast.ts`; `operator-session-clear.ts`; `SessionIdleTimeoutGuard.tsx` | No `BroadcastChannel` when API unavailable (degrades same-tab only) |
| Work-lease | LW-089–094 | **Yes** | `ArchitectureWorkLeaseService.cs`; `ArchitectureDraftWorkLeaseBanner.tsx`; SQL migration + in-memory repo | Soft lease — not occupancy heartbeats |
| Recovery | LW-095–098 | **Yes** | `error-recovery-contract-copy.ts` (TB-2155); `showMutationError` sticky toasts (LW-097); workspace conflict inline (TB-2006) | Draft 409 conflicts stay inline-only for autosave |
| Close | LW-099–100 | **Yes** | `lost-write-prompt-inventory.test.ts`; this file | Wave ends at LW-100 |

## Prompt inventory

All **100** paste-ready files under `.cursor/prompts/lost-write-*.md` plus `lost-write-00-index.md` are present. Vitest ratchet: `archlucid-ui/src/lib/lost-write-prompt-inventory.test.ts`.

## Residuals (out of wave)

| Item | Tracking | Notes |
|------|----------|-------|
| ADR 0088 / 0089 / 0090 formal **Accepted** status | LW-001 / 007 / 008 | ADRs remain **Proposed**; server + UI wiring implements the decisions |
| Intake wizard + identity rename dirty guards | LP-11 deferred | Partial — approval rationale shipped (LW-071–073) |
| Insight density / `DeterministicInsightDensityGate` | DX backlog | No 40th engine; `typed-engine-protected` unchanged |
| Favorites / recents / pins server sync | Product backlog | Explicitly out of wave |
| Density prefs, rate-limit partition, tenant escrow ZIP | Product / GTM | Out of wave |
| In-app changelog | Product backlog | Out of wave |
| `MUTATION_UNDO_WINDOW_SECONDS = 300` | unchanged | Owner decision — not lengthened |
| Toast history / collab strip | AD-06 / TB-2248 | Recent history only — not live viewers |
| G-REAL-06 Real-mode default host config | GTM | Do not flip `AgentExecution:Mode` |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | TB-135/TB-136 tech Done; GTM owner work open |
| GTM cohorts M-90 / M-44 / M-91 / M-92 | GTM V1.1 | Not assessment engineering batches |
| Live presence / finding-comment chat | out of product | ADR 0090 / 0037 |

## Do not claim

- **Live presence** avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Insight density** engines closed or a 40th coverage engine added.
- **CPA SOC 2** attestation or published third-party pen test.
- **G-REAL-06** executed or host `AgentExecution:Mode` default moved to Real.
- **Second tenant** or SQL RLS from work-lease or cross-tab auth broadcast.
- Offline v1 queue entries were **server-repaired** — migration is client-side only.

## Verification commands (focused)

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/lost-write-prompt-inventory.test.ts \
  src/lib/lost-write-inventories.test.ts \
  src/lib/lost-write-adr-guard.test.ts \
  src/lib/lost-write-patch-draft-cas-ratchet.test.ts \
  src/lib/architecture/architecture-draft-offline-queue-replay.test.ts \
  src/lib/auth/livelihood-mutation-401-resume.test.ts \
  src/lib/error-recovery-contract-guard.test.ts \
  src/lib/livelihood-document-guard-guard.test.ts \
  src/components/SessionIdleTimeoutGuard.test.tsx \
  src/lib/auth/session-idle-broadcast.test.ts \
  src/components/architecture/ArchitectureDraftWorkLeaseBanner.test.tsx \
  src/lib/architecture/architecture-draft-work-lease-copy.test.ts \
  src/lib/lost-write-mutation-error-toast-guard.test.ts
```

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj \
  --filter 'FullyQualifiedName~DraftPatchStaleUpdatedUtcGuardTests|FullyQualifiedName~ArchitectureWorkLeaseServiceTests'
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --filter 'FullyQualifiedName~DraftRequestsControllerWorkLeaseTests|FullyQualifiedName~MicrosoftOpenApiDraftPatchCasDocumentTransformerTests'
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj \
  --filter 'FullyQualifiedName~LostWrite'
```

## Related

- [ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md](ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md) — wave 22 predecessor; named LW-001–LW-100 for concurrent desk without presence
- [LIVELIHOOD_PROOF_ACCEPTANCE_2026-09-08.md](LIVELIHOOD_PROOF_ACCEPTANCE_2026-09-08.md) — LP-19 401 resume predecessor (sessionStorage, two kinds)
- [FINDING_POINTER_CAS_ACCEPTANCE_2026-09-08.md](FINDING_POINTER_CAS_ACCEPTANCE_2026-09-08.md) — wave 21 disposition pointer CAS
- [LOST_WRITE_OFFLINE_QUEUE_CAS.md](LOST_WRITE_OFFLINE_QUEUE_CAS.md) — offline replay contract
- [LOST_WRITE_CAS_COMPAT.md](LOST_WRITE_CAS_COMPAT.md) — omit-token 409 compat matrix
