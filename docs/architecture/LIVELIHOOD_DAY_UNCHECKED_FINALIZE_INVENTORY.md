> **Scope:** Contributor-reference — Unchecked decision-grade rows judged at Real finalize (LY-014). Not buyer-facing copy.

# Livelihood-day Unchecked finalize inventory (LY-014)

ADR **0099** Premium semantic-support judge at Working Career **Real** finalize / readiness.

## In scope (judged)

| Surface | Gate |
|---------|------|
| `CommitOutputIntegrityService` before Unsupported hold | `FindingSemanticSupportBandFinalizeJudge.ApplyAsync` |
| `FinalizeReadinessService` before Unsupported hold | same |

**Row filter:** `FindingSemanticSupportBandFinalizeJudgeEligibility.ShouldJudge`

- Classification is **decision-grade** (`DecisionGradeFindingExportFilter`)
- At least one non-whitespace `EvidenceRefs` citation
- Band is **Unchecked** or null

## Out of scope (not judged)

| Row | Why |
|-----|-----|
| Checklist coverage | Density/classification, not citation semantics |
| Empty / whitespace-only `EvidenceRefs` | Provenance (ADR 0082) — NotScored, not Unchecked |
| Heuristic **Supported** | Faithfulness: do not demote exact-quote |
| Heuristic **Unsupported** | Faithfulness: do not invent Supported from disjoint citations |
| Simulator / Fallback | `FindingSemanticSupportBandFinalizeJudgePolicy.ShouldRun` is false |
| `EnableLlmJudgeOnFinalize=false` | Host opt-out |

## Ratchet

- `FindingSemanticSupportBandFinalizeJudgeEligibilityTests`
- `FindingSemanticSupportBandFinalizeJudgeTests`
