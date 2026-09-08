> **Scope:** Contributor-reference — wave 20 (LP-01–LP-20) close-audit evidence for livelihood-proof fail-closed gates; not buyer-facing copy.

# Livelihood-proof wave close audit (LP-20)

> **Date:** 2026-09-08 (wave 20 — LP-01–LP-20)  
> **Owner decision:** Execute leftover fail-closed **persist** gates WS/FC/DR named but did not wire. Do **not** flip `AgentExecution:Mode` default from Simulator.  
> **Spine:** [ADR 0082](adrs/0082-decision-grade-provenance-fail-closed.md) · [ADR 0083](adrs/0083-promote-activate-submit-same-tx-audit.md) · [LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md](LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** for livelihood-proof engineering gates on this branch, **subject to the residuals below**.

Load-bearing acceptance checks (LP-20 prompt):

| Criterion | Result |
|-----------|--------|
| LP-02 typed Kind A persist gate green | **Yes** — `FindingProvenanceEmissionApplicator` demotes missing Kind A before snapshot persist |
| LP-03 agent Kind B persist gate green | **Yes** — `AgentArchitectureFindingEmissionGate` withholds prose-only decision-grade rows before agent persist |
| LP-05 no trace-synthesized finding cards | **Yes** — `resolveQuickDecisionFindingsForRunDetail` never invents rows from explanation traces |
| Decision-grade **new** persist with empty per-finding `EvidenceRefs` | **No** on current emission paths (agent withheld; typed demoted; career export blocks) |

This audit does **not** claim DX insight-density engines closed, G-REAL-06 Real-mode pilots, CPA SOC 2 (**G-REAL-05**), or third-party pen-test publication (**G-ASSURANCE-02**). ADR **0082** and **0083** remain **Proposed** (contract + wiring shipped; formal ADR acceptance is a separate owner step).

## Evidence table

| Area | Prompts | Evidence | Status |
|------|---------|----------|--------|
| ADR 0082 contract | LP-01 | `docs/architecture/adrs/0082-decision-grade-provenance-fail-closed.md` (**Proposed**); `decision-grade-provenance-adr-inventory.ts` | Contract shipped |
| Typed Kind A emission gate | LP-02 | `FindingProvenanceValidator.cs`, `FindingProvenanceEmissionApplicator.cs`, `FindingsMergeAndGateStage.cs` | **Persist gate shipped** |
| Agent Kind B emission gate | LP-03 | `AgentArchitectureFindingProvenanceValidator.cs`, `AgentArchitectureFindingEmissionGate.cs`, `AgentArchitectureFindingEmissionEnricher.cs` | **Persist gate shipped** |
| Citation coverage PilotStrict | LP-04 | `AgentOutputTraceFindingCitationCoverageApplicator.cs`, `AgentOutputQualityGate.cs` | Shipped (Working Real commit path) |
| Dual-stream desk honesty | LP-05 | `quick-decision-finding-merge-and-sort.ts`, `finding-stream-product-of-record-copy.ts` | Shipped (no trace synthesis) |
| Simulator career incompleteness | LP-06 | `simulator-career-honesty.ts`, `career-artifact-honesty.ts`, `SimulatorCareerHonestyPresenter.cs` | Shipped |
| LLM rec heuristic provenance | LP-07 | `ArchitectureRecommendationLlmHeuristicMerger.cs` | Shipped |
| ADR 0083 contract | LP-08 | `docs/architecture/adrs/0083-promote-activate-submit-same-tx-audit.md` (**Proposed**) | Contract shipped |
| Promote / activate / submit co-commit | LP-09 | `GovernanceWorkflowSubmitStage.cs`, `GovernanceWorkflowPromotePersistStage.cs`, `GovernanceWorkflowActivateStage.cs` | **Persist + audit atomicity shipped** |
| Authority-chain Required audit | LP-10 | `AuthorityCommittedChainDurableAudit.LogRequiredAsync`, `AuthorityCommitPersistenceStage.cs` | Fail-closed shipped (career path) |
| Livelihood guard inventory | LP-11 | `livelihood-document-guard-inventory.ts`, `livelihood-document-guard-guard.ts` | Shipped (shrink ratchet) |
| OIDC keepalive on editors | LP-12 | `operator-oidc-keepalive-route.ts`, `use-oidc-session-keepalive.ts` | Shipped |
| Expert intake Working default | LP-13 | `expert-intake-posture.ts`, `FirstPilotIntakeWizard` | Shipped |
| Apply-change preview server attested | LP-14 | `FindingDispositionValidation.cs`, `finding-apply-change-preview-gate.ts` | Server persist gate shipped |
| Architect restatement append-only | LP-15 | `RecordFindingDispositionRequest.cs`, disposition trail + export honesty | Shipped |
| Open questions export honesty | LP-16 | `OpenQuestionsExportHonesty.cs`, `architecture-open-questions-export-honesty.ts` | Shipped |
| ITSM HumanReviewStatus CAS | LP-17 | `ItsmInboundDispositionSync.cs`, `finding-human-review-disposition-divergence.ts` | Shipped (409 skip + divergence banner) |
| Pre-commit gate Working honesty | LP-18 | `RunDetailPreFinalizeGateHonestyStrip.tsx`, `CareerArtifactCompletenessValidator`, `career-artifact-honesty.ts` | **Partial** — see residuals |
| 401 resume in-flight mutations | LP-19 | `livelihood-mutation-401-resume.ts`, `use-resume-pending-livelihood-mutation.ts` | Shipped |
| Close audit | LP-20 | This file | Shipped |

## Persist gates vs honesty-only (LP-02 / LP-03)

| LP | Classification | Behavior |
|----|----------------|----------|
| **LP-02** | **Persist gate** | Typed engine findings missing Kind A (`RelatedNodeIds` + `RulesApplied`) are **demoted** to checklist band before snapshot persist — not decision-grade. |
| **LP-03** | **Persist gate** | Agent `ArchitectureFinding` rows lacking Kind B are **withheld** from `result.Findings` before agent result persistence (`ProseOnlyEmission`). |

Career surfaces (`career-artifact-honesty.ts`, `DecisionGradeFindingProvenanceValidator`) add a second fail-closed layer on export/finalize; they do not replace emission gates.

## Residuals (out of wave)

| Item | Tracking | Notes |
|------|----------|-------|
| ADR 0082 / 0083 formal **Accepted** status | LP-01 / LP-08 | ADRs remain **Proposed**; LP-02–04 and LP-09 implement the decisions |
| LP-18 **Ready to finalize** label when gate off | Draft PR #2339 | Banner + career export/finalize blocks shipped; Ready pipeline label suppression lands with LP-18 merge |
| Grandfathered pre-gate snapshots | Storage | Emission gates do not retroactively rewrite committed rows |
| DX insight-density engines | DX backlog | ADR 0070 predicate unchanged; no 40th engine |
| Semantic faithfulness / TB-1228 | Tech backlog | Separate from TB-1221 structural provenance |
| G-REAL-06 Real-mode default | GTM | Owner execution; `AgentExecution:Mode` default **Simulator** unchanged |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | GTM owner programs (TB-135/TB-136 tech Done) |
| Admin eval grandfather rows | WS-08 inventory | Shrink-only from Working-seat wave |

## Verification commands (focused)

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/findings/decision-grade-provenance-adr-guard.test.ts \
  src/lib/quick-decision-finding-stream-resolver.test.ts \
  src/lib/quick-decision-summary-derive.test.ts \
  src/lib/career-artifact/career-artifact-honesty.test.ts \
  src/lib/governance/simulator-career-honesty.test.ts \
  src/lib/governance/promote-activate-same-tx-adr-guard.test.ts \
  src/lib/livelihood-document-guard-guard.test.ts \
  src/lib/findings/finding-apply-change-preview-gate.test.ts \
  src/lib/findings/finding-human-review-disposition-divergence.test.ts \
  src/lib/auth/livelihood-mutation-401-resume.test.ts \
  src/lib/livelihood-proof-prompt-inventory.test.ts
```

```bash
export PATH="$HOME/.dotnet:$PATH"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj \
  --filter 'FullyQualifiedName~FindingProvenanceValidatorTests|FullyQualifiedName~AgentArchitectureFindingEmissionGateTests'
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --filter 'FullyQualifiedName~GovernanceWorkflowServiceSameTxAuditTests'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj \
  --filter 'FullyQualifiedName~ItsmInboundDispositionConcurrentRaceTests'
```

## Related

- [WORKING_SEAT_ACCEPTANCE_2026-09-07.md](WORKING_SEAT_ACCEPTANCE_2026-09-07.md) — wave 19 Working-seat close audit (chrome shipped; LP owns persist gates)
- [DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md](../library/DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md) — TB-1221 contract
- [LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md](LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md) — paste-ready LP-01–LP-20 prompts (do not re-run)
