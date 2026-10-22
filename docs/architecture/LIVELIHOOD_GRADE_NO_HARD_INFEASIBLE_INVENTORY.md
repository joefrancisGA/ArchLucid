> **Scope:** Shrink-only inventory — surfaces that can present **hard** / impossible feasibility on Working Career without a law citation. LN-004 owns the gate; this file names call sites.

# Livelihood-grade-no hard-infeasible inventory (LN-002)

**Last reviewed:** 2026-09-11 · **ADR:** [0093](adrs/0093-false-hard-citation-working-career.md)

| Surface | Field / path | Citation required on Working Career export? | Owner prompt | Notes |
|---------|--------------|---------------------------------------------|--------------|-------|
| Manifest feasibility verdict | `goldenManifest.feasibilityVerdict.kind` | **Yes** when `HardInfeasible` | LN-004 | `FeasibilityVerdictValidator` at emission; LN-004 at export |
| Career artifact honesty (TS) | `evaluateCareerArtifactHonesty` | **Yes** | LN-004 | `resolveHardInfeasibleCitationExportBlockedReason` |
| Career artifact honesty (C#) | `CareerArtifactCompletenessValidator` | **Yes** | LN-004 | `WorkingCareerHardInfeasibleCitationValidator` |
| Feasibility desk section | `RunDetailFeasibilityVerdictSection` | Display demotes; export gated | LN-021 | UI must not label Career-hard when demoted |
| Export markdown section | `formatFeasibilityVerdictMarkdownSection` | **Yes** | LN-013 | Hard vs soft sections |
| Sponsor PDF | `SponsorOnePagerPdfBuilder` | **Yes** | LN-022 | Omit or cite hard |
| Decision receipt | `decision-receipt-export.ts` | **Yes** | LN-038 | `resolveDecisionReceiptExportBlockedReason` |
| Compare chrome | `CompareVerdictChromeDeltaBuilder` | Delta honesty only | LN-037 | Citation appeared/disappeared |
| CLI export/finalize | `archlucid` stdout/json | **Yes** | LN-023 | Refuse unlabeled hard |

**Simulator / Rehearsal:** may stay labeled incomplete — not Career-hard (CG/LP).

## Ratchet

- `archlucid-ui/src/lib/livelihood-grade-no-hard-infeasible-inventory.ts`
- `archlucid-ui/src/lib/livelihood-grade-no-hard-infeasible-inventory.test.ts`
