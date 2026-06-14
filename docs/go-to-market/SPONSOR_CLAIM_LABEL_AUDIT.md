> **Scope:** Release audit checklist — sponsor-facing execution-mode and evidence-basis labels. Not buyer-facing.

# Sponsor claim and execution-mode label audit

**Last reviewed:** 2026-06-14

## Surfaces in scope

| Surface | Label fields | Test / guard |
| --- | --- | --- |
| First-value report (Markdown) | Execution mode, evidence-basis labels, ROI basis | `FirstValueReportBuilderTests`, `ExecutionModeCrossSurfaceInvariantTests` |
| Sponsor proof packet | Mode, limitations, ROI table | `SponsorEvidencePackServiceTests` |
| Review-detail trust card | Execution mode status | `RunTrustEvidenceCardBuilderTests` |
| Executive ROI summary | Real-mode filter, estimate caveats | `ExecutiveRoiSummaryServiceExtendedTests` |
| UI review detail / value report | Mode callouts, demo labels | Vitest `RunTrustEvidenceCardSection.test.tsx` |
| Proof pipeline outputs | `realModeEvidenceStatus`, sponsor disposition | `collect-first-pilot-proof.Tests.ps1` |

## Rules (V1)

1. **Never** present simulator, fallback, or demo-derived output as live customer proof without explicit labels.
2. **Never** lead with projected dollar ROI when `projectedDollarClaimsSponsorSafe` is false or ROI basis is `defaulted` / `demo-derived` / `not-collected`.
3. **Always** include execution mode (Real / Simulator / Fallback / Mixed) on sponsor exports.
4. **Always** include evidence-basis badges (Evidence-backed, Estimate, Low support, Manual review required, Deferred scope) where applicable.
5. Deferred V1.1/V2 capabilities must use **Deferred scope** — not implied as shipped.

## RC verification

```powershell
# .NET invariant tests
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ExecutionModeCrossSurfaceInvariantTests"

# Proof pipeline contract
Invoke-Pester -Path scripts/tests/collect-first-pilot-proof.Tests.ps1
```

**Cross-refs:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) G1 · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
