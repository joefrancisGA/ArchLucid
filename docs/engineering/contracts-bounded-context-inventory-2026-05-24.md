> **Scope:** Read-only engineering inventory for assessment #34 Phase 1 — Contracts namespace groups, consumer counts, and bounded-context remediation targets; not an implementation plan or source of runtime truth.

# Contracts bounded-context inventory (#34 Phase 1)

Read-only inventory for assessment #34. Generated 2026-05-24.

## Summary

| Namespace group | Source files | Consumer files (approx.) | Owning context |
|-----------------|-------------|---------------------------|----------------|
| `Contracts.Decisions` | 5 | 54 | Decisioning |
| `Contracts.DecisionTraces` | 9 | 66 | Decisioning |
| `Contracts.Explanation` | 6 | 25 | Application |
| `Contracts.Agents` (eval/prompts) | ~12 | 30+ | AgentRuntime |
| `Contracts.Agents.AgentExecutionTrace` | 1 (+ helpers) | 100+ | AgentRuntime |

## Contracts.Decisions (5 files)

- `DecisionNode.cs`, `DecisionOption.cs`, `AgentEvaluation.cs`, `ManifestDeltaProposal.cs`, `EvaluationTypes.cs`

**Consumers:** Decisioning merge (`DecisionEngineV2`, strategies, mergers), Application orchestration/evaluation, Persistence `DecisionNodeRepository` / `AgentEvaluationRepository`, Core ports `IDecisionNodeRepository`, Api `DecisionNodeResponse`.

**Remediation:** Domain types → `ArchLucid.Decisioning.Decisions`; slim `Contracts.Persistence.Decisions.*Record` for Api/Persistence/Core ports.

## Contracts.DecisionTraces (9 files)

- `DecisionTrace.cs`, `RunEventTrace.cs`, `RuleAuditTrace.cs`, payloads, `DecisionTraceJsonConverter.cs`, `DecisionTraceKind.cs`

**Consumers:** Persistence `SqlDecisionTraceRepository`, Application commit/finalization, Provenance `IProvenanceBuilder`, Api run detail DTOs, Core `IDecisionTraceRepository`.

**Remediation:** Domain types → `ArchLucid.Decisioning.DecisionTraces`; slim `Contracts.Persistence.DecisionTraces.DecisionTraceDto` for boundaries.

## Contracts.Explanation (6 files)

- `FindingExplainabilityResult.cs`, `FindingExplainabilityEvidence.cs`, `CitationReference.cs`, `CitationKind.cs`, `FindingLlmAuditResult.cs`, `FindingEvidenceChainResponse.cs`

**Consumers:** Application explanation services, Api `ExplanationController`, pilots/trust builders, Decisioning `FindingExplainabilityNarrativeBuilder`.

**Remediation:** Domain models → Application; shared read DTOs in `Contracts.Persistence.Explanation` for Decisioning narrative builder.

## Contracts.Agents — eval/prompts (~12 types)

- `IAgentOutputEvaluator`, `IAgentOutputQualityGate`, `IAgentOutputSemanticEvaluator`, `IAgentOutputTraceEvaluationHook`, `NoOpAgentOutputTraceEvaluationHook`, `AgentOutputEvaluationResultInsert`, `IPromptVariantRegistry`, `PromptVariantRecord`, `PromptVariantSelection`

**Consumers:** AgentRuntime evaluation pipeline, Host.Composition DI, Persistence `SqlPromptVariantRegistry`, Api evaluation controller.

**Remediation:** Move to `ArchLucid.AgentRuntime` internal contracts namespaces.

## AgentExecutionTrace

**Consumers:** AgentRuntime recorder, Persistence trace repos, Api `AgentExecutionTraceResponse`, Application cost/trust/pilot services.

**Remediation:** Split into `Contracts.Agents.AgentExecutionTraceSummary` (≤12 props) + `AgentRuntime.Traces.AgentExecutionTraceDetail`.

## Boundary constraints

- **Api** must not reference Decisioning (`Api_must_not_depend_on_Decisioning`).
- **Persistence** must not reference Decisioning (`Persistence_must_not_depend_on_Decisioning`).
- **Core ports** use Contracts slim DTOs only.
