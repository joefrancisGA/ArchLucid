> **Scope:** Release audit checklist — sponsor-facing execution-mode and evidence-basis labels. Not buyer-facing.

# Sponsor claim and execution-mode label audit

**Last reviewed:** 2026-06-18

## Unsupported-Claim Audit (Task #8) — 2026-06-18 pass

Full-scope audit of sponsor-facing outputs per assessment Task #8. **Disposition: PASS** after targeted copy patches and CI guard extension.

| Surface | Audit result | Labels verified | Patches this pass |
| --- | --- | --- | --- |
| First-value report (Markdown/PDF) | PASS | Execution mode, evidence-basis, ROI narrative claim gate (PASS/WARN/HOLD), decision delta, novelty confidence, deferred buyer requirements | None — already gated via `SponsorFirstValuePdfGate` |
| Value report (DOCX) | PASS | ROI narrative claim gate, HOLD suppresses annualized USD/ROI %, LLM cost methodology note | None — `DocxValueReportRenderer` already emits gate |
| Demo preview (`/demo/preview`, `/see-it`) | PASS (after patch) | Demo/illustrative disclosure, evidence-basis badges on sponsor-mode summary | `ShowcaseOutcomeStrip.illustrativeSample` softens governance CTA on public demo |
| Why-ArchLucid proof surfaces (`/why`, PDF pack) | PASS (after patch) | Citation disclaimers, illustrative category baselines, sample-not-customer on demo embed | Replaced “benchmarked” / “real finalized-manifest” wording |
| Procurement-facing summaries | PASS | `BUYER_SECURITY_PROCUREMENT_PACKET.md` buyer-safe rule; trust center deferred assurance | None |
| Sponsor distribution UI | PASS (after patch) | Execution-mode badge, projected-dollar blocks, ROI baseline gate on PDF/DOCX | “(estimate)” on projected savings badge; DOCX claim-gate notice |

**CI guard:** `scripts/ci/check_sponsor_evidence_label_consistency.py` now enforces required label anchors on all surfaces above (plus procurement conversion docs). Run via `run_buyer_surface_strict_guards.py`.

**Residual risk:** AI finding faithfulness under adversarial real-mode packets — out of scope for label audit; tracked under Task #11 (Real-Mode Faithfulness Evidence Rollup).

## Surfaces in scope

| Surface | Label fields | Test / guard |
| --- | --- | --- |
| First-value report (Markdown) | Execution mode, evidence-basis labels, ROI basis, **ROI narrative claim gate (PASS/WARN/HOLD)**, **decision delta**, **novelty confidence** | `FirstValueReportBuilderTests`, `SponsorDecisionDeltaNoveltyResolverTests`, `SponsorRoiClaimDispositionResolverTests`, `ExecutionModeCrossSurfaceInvariantTests` |
| First-value report (PDF) | Demo-only / needs-baseline watermarks, execution mode, ROI gate blocks | `SponsorFirstValuePdfGateTests`, `FirstValueReportPdfBuilderTests` |
| Value report (DOCX) | ROI narrative claim gate, HOLD suppression, LLM cost methodology | `DocxValueReportRenderer`, `ValueReportReviewCycleSectionFormatter` |
| Executive review packet (Markdown) | Execution mode, ROI disposition | `ExecutiveReviewPacketGoldenFixtureTests`, `SponsorExecutionModeMarkdownFormatter` (shared with first-value report) |
| Sponsor proof packet | Mode, limitations, ROI table | `SponsorEvidencePackServiceTests` |
| Review-detail trust card | Execution mode status | `RunTrustEvidenceCardBuilderTests` |
| Executive ROI summary | Real-mode filter, estimate caveats | `ExecutiveRoiSummaryServiceExtendedTests` |
| UI review detail / value report | Mode callouts, demo labels, sponsor PDF execution-mode block | Vitest `RunTrustEvidenceCardSection.test.tsx`, `EmailRunToSponsorBanner.test.tsx` |
| Demo preview / see-it marketing | Illustrative sample, evaluation preview, evidence-basis on sponsor summary | `DemoPreviewMarketingBody`, `SeeItMarketingBody`, `check_sponsor_evidence_label_consistency.py` |
| Why-ArchLucid pack | Citation-backed rows, illustrative baselines, sample demo embed | `why-archlucid-comparison.ts`, `WhyArchLucidPackBuilder.cs`, `check_why_archlucid_comparison_sync.py` |
| Procurement evidence packet | Deferred assurance, no over-claim buyer-safe rule | `check_claim_evidence_consistency.py`, `BUYER_SECURITY_PROCUREMENT_PACKET.md` |
| Socratic draft intake (operator) | Structural admission, LLM intake reasoning, redirect receipt, admitted draft, spawned review | Vitest `SocraticIntakeWizard.test.tsx`, `DraftIntakeClaimLabel` surfaces |
| Proof pipeline outputs | `realModeEvidenceStatus`, sponsor disposition | `collect-first-pilot-proof.Tests.ps1` |

## Rules (V1)

1. **Never** present simulator, fallback, or demo-derived output as live customer proof without explicit labels.
2. **Never** lead with projected dollar ROI when `projectedDollarClaimsSponsorSafe` is false or ROI basis is `defaulted` / `demo-derived` / `not-collected`. The first-value report **ROI narrative claim gate** emits **PASS**, **WARN**, or **HOLD** with matching comparative-language qualifiers.
3. **Always** include execution mode (Real / Simulator / Fallback / Mixed) on sponsor exports.
4. **Always** include evidence-basis badges (Evidence-backed, Estimate, Low support, Manual review required, Deferred scope) where applicable.
5. Deferred V1.1/V2 capabilities must use **Deferred scope** — not implied as shipped.
6. **Decision delta** and **novelty confidence** sections must appear on first-value Markdown exports (headings: `## Decision delta (recommended changes)`, `## Novelty confidence`).
7. Public demo / why-embed surfaces must not use **“real customer”** or **“benchmarked”** language for sample output — use **illustrative**, **sample**, or **citation-backed** instead.

## RC verification

```powershell
# Sponsor output anchor guard (Task #8 scope)
python scripts/ci/check_sponsor_evidence_label_consistency.py

# .NET invariant tests
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ExecutionModeCrossSurfaceInvariantTests"

# Proof pipeline contract
Invoke-Pester -Path scripts/tests/collect-first-pilot-proof.Tests.ps1

# First-value lane + sponsor section anchors
python scripts/ci/validate_first_value_lane.py

# Full buyer-surface guard bundle
python scripts/ci/run_buyer_surface_strict_guards.py --strict
```

**Cross-refs:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) G1 · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) · [`PROOF_LANGUAGE_CLAIM_AUDIT.md`](PROOF_LANGUAGE_CLAIM_AUDIT.md) (buyer-facing proof packets + demo scripts; superlative guard)
