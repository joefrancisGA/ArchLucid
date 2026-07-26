> **Reviewed:** 2026-07-26

> **Scope:** Release audit checklist — sponsor-facing execution-mode and evidence-basis labels, plus the static buyer-facing proof-language claim audit (formerly `PROOF_LANGUAGE_CLAIM_AUDIT.md`; assessment §17 #7). Includes the 2026-06-16 send/no-send hardening review appendix. Not buyer-facing.

# Sponsor claim and execution-mode label audit

**Last reviewed:** 2026-07-26


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

**Cross-refs:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) G1 · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) · [`#proof-language-claim-audit-static-buyer-docs`](#proof-language-claim-audit-static-buyer-docs) (buyer-facing proof packets + demo scripts; superlative guard)

---

## Proof-language claim audit (static buyer docs)

Release audit log for **buyer-facing proof packets and demo scripts** — classifies each surface's dominant claim types and confirms no unsupported superlatives. Implements assessment **§17 #7 (Proof-language claim audit)**. Sponsor-generated *output* labels (first-value report, value DOCX, sponsor packet) are audited in the Task #8 section above; this section covers the static buyer-facing **documents**.

This audit answers one question for every buyer-facing proof packet and demo script: **is each claim labeled with the kind of backing it actually has, and are unsupported superlatives removed?** It reuses the existing claim guardrails ([`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise), the buyer-surface CI guards) and adds a tight superlative regression guard — it does not restate policy those docs own.

### Claim-type taxonomy (canonical for §17 #7)

Five backing types. Each buyer-facing claim should be reducible to one of them; if it cannot, it is an over-claim and must be softened or labeled.

| Type | Meaning | Canonical backing layer |
| --- | --- | --- |
| **extractor-backed** | Traces to uploaded Azure extractor ZIP evidence (cost/savings cite `manifest.json` `collectionTimestamp` + schema version). | `ProofPacketSourceLabelsBuilder.cs`; board-pack posture `extractor-backed` in `executive-roi-board-pack-evidence-clusters.ts`. |
| **review-backed** | Traces to a finalized review's persisted findings / architecture package / audit rows. | Architecture package (API: golden manifest) + authority chain; `DIFFERENTIATION_PROOF_PACKET.md`. |
| **illustrative** | Demo-derived / sample, explicitly not a customer outcome. | `illustrative` posture; demo-proof-packet labels; `ROI_BASELINE_SEND_POLICY.md` (`demo-derived`). |
| **self-assessed** | Internally attested (e.g. SOC mapping), not third-party issued. | `SOC2_SELF_ASSESSMENT_2026.md`, `trust-center.md`, `PROCUREMENT_PACK_INDEX.md` (`Self-attested`). |
| **roadmap** | Deferred V1.1/V2 capability — stated as planned, never as shipped. | `V1_DEFERRED.md`; `PROCUREMENT_PACK_INDEX.md` (`Deferred`); `PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`. |

Governance overlay (orthogonal): AI output is **governed** vs **advisory** per `ai-output-governance-label.ts`; ROI dollar headlines obey the first-value **ROI narrative claim gate** (PASS/WARN/HOLD) — see Rule 2 above.

### Audited surfaces (2026-06-27 pass)

Dominant claim types present and the labels that keep them honest. Disposition is **PASS** for all rows after this pass.

| Surface | Dominant claim types | Honest-label anchors |
| --- | --- | --- |
| `BUYER_SECURITY_PROCUREMENT_PACKET.md` | review-backed, self-assessed, roadmap | "does **not** claim", deferred assurance |
| `QUOTE_TO_PROOF_PACKET.md` | review-backed, illustrative, roadmap | ROI basis, send rule |
| `QUOTE_TO_PROOF_PACKET.md` (executive paid-pilot section) | extractor-backed, review-backed, self-assessed, roadmap | six-element claim-boundary column |
| `DIFFERENTIATION_PROOF_PACKET.md` | review-backed, illustrative, self-assessed | "what we do **not** claim", ROI basis labels |
| `DIFFERENTIATION_PROOF_PACKET.md` | review-backed, extractor-backed | evidence-linked comparison section |
| `EXECUTIVE_SPONSOR_BRIEF.md` | review-backed, illustrative | execution-mode + estimate caveats |
| `GENERIC_AI_BAKEOFF_PROTOCOL.md` (evidence pack sections) | review-backed, illustrative | bakeoff honesty ("where each wins") |
| `POLICY_PACK_DELTA_DEMO_SCRIPT.md` (pilot run-sheet) | review-backed, illustrative | "review evidence, not certification" |
| `POLICY_PACK_DELTA_DEMO_SCRIPT.md` | review-backed, illustrative | governance-evidence-not-certification grounding rule |
| `DEMO_VIDEO_SCRIPT.md`, `DEMO_QUICKSTART.md` | illustrative | demo/sample framing |
| `GENERIC_AI_BAKEOFF_PROTOCOL.md` | review-backed, illustrative | honest "where each wins" |
| `PROCUREMENT_OBJECTION_PLAYBOOK.md` (incl. controlled pilot drill) | self-assessed, roadmap | honest-posture answers |
| `DIFFERENTIATION_PROOF_PACKET.md` (model-seats message test) | review-backed, self-assessed | grounding rule: "do **not** claim ArchLucid always beats frontier AI" |
| `buyer-jobs/*` (demo proof shape sections) | illustrative | sample-not-customer labels |
| `templates/evidence-packet-buyer.template.md` | all five (as columns) | claim-boundary column |

**Patch this pass:** model-seats grounding rule (now in `DIFFERENTIATION_PROOF_PACKET.md`) — "Do **not** claim ArchLucid always beats frontier AI" is correct guidance; the new guard now normalizes markdown emphasis so the bolded `**not**` registers as a caveat (no copy change required). No unsupported superlatives remain in scope.

### Superlative regression guard

`scripts/ci/check_proof_language_superlatives.py` scans the surfaces in `scripts/ci/data/proof_language_audit_scope.v1.json` for a **tight** list of unsupported superlatives (best-in-class, world-class, industry-leading, unmatched, guaranteed savings/ROI, never fails, always beats, 100% accurate, fully compliant, …). A term is flagged **only** when the line carries no caveat/backing marker (do not / without / illustrative / estimate / roadmap / source-labeled / …), and markdown emphasis is normalized first so bolded caveats still count. Common, legitimate terms (e.g. "enterprise-grade", "fastest path") are deliberately excluded to keep the guard trustworthy.

Wired into the buyer-surface bundle (`scripts/ci/run_buyer_surface_strict_guards.py`) and unit-tested in `scripts/ci/tests/test_check_proof_language_superlatives.py`.

### Verification (proof-language)

```powershell
python scripts/ci/check_proof_language_superlatives.py
python -m pytest scripts/ci/tests/test_check_proof_language_superlatives.py
python scripts/ci/run_buyer_surface_strict_guards.py --strict
```

### Residual (human / GTM half)

The automated guard removes unsupported superlatives and the matrix classifies dominant claim types, but **line-level sign-off on borderline comparative/ROI claims and the live buyer reaction** are market-execution. Pair this audit with the procurement objection rehearsal (`GTM_BACKLOG.md` **M-91**) when that window opens; do not treat a green scan as buyer acceptance.

Former standalone: `docs/go-to-market/PROOF_LANGUAGE_CLAIM_AUDIT.md` → this section.

---

## Appendix — Send/no-send hardening review (2026-06-16)

Point-in-time follow-up confirming sponsor-facing artifact paths cannot be sent with missing execution mode, weak ROI basis, demo-derived data, or low support.

### Surfaces reviewed

| Surface | Execution mode | ROI gate | Demo / low support | Verdict |
| --- | --- | --- | --- | --- |
| First-value report (Markdown) | ✅ Sponsor first-page table | ✅ PASS/WARN/HOLD narrative gate | ✅ Demo tenant banner | **OK** |
| Executive review packet (Markdown) | ✅ **Added 2026-06-16** (`## Execution mode`) | ✅ ROI claim disposition section | ⚠️ Demo run context operator-dependent | **Fixed gap** |
| Sponsor evidence pack (API) | ⚠️ Indirect via deltas/trust surfaces | Partial — process instrumentation | Demo run id explicit in response | **OK with labels** |
| Executive ROI summary (API) | Via trust card / run detail | ✅ Disposition resolver | Heuristic fallback → HOLD | **OK** |
| Architecture Review DOCX/PDF | ✅ Provenance footer | ✅ ROI sections | Whitelabel does not strip labels | **OK** |
| Proof pipeline (`collect-first-pilot-proof.ps1`) | ✅ `realModeEvidenceStatus` | ✅ `roiSponsorSafe`, `-FailOnHold` | ✅ BLOCK rows | **OK** |
| UI command center phase | ✅ `sponsorDisposition` | ✅ Baseline gate | ✅ Deferred scope phase | **OK** |

### Finding (2026-06-16)

**Gap:** `ExecutiveReviewPacketComposer` exported sponsor Markdown **without** an execution-mode section, violating rule 3 above.

**Remediation:** Shared `SponsorExecutionModeMarkdownFormatter` + executive packet `## Execution mode` section + golden fixture / cross-surface tests.

### Send / no-send rules (consolidated)

**SEND only when all true:**

- `sponsorPacketDisposition` ∈ {READY, WARN} and proof `-FailOnHold` passes
- Execution mode visible on **every** sponsor export path used
- ROI narrative gate ≠ HOLD when quoting dollars or % savings
- `projectedDollarClaimsSponsorSafe` = true for projected USD
- Not demo-derived outcome claims on demo tenant

**HOLD when any:**

- BLOCK row in proof pipeline
- Simulator/Fallback without labels
- ROI basis `not-collected` / `demo-derived` with dollar lead
- PilotStrict failed on real-mode host
- Missing real-mode gate while claiming full-real-mode (see [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md))

### Verification commands

```powershell
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ExecutiveReviewPacketGoldenFixtureTests|FullyQualifiedName~ExecutionModeCrossSurfaceInvariantTests"
Invoke-Pester -Path scripts/tests/collect-first-pilot-proof.Tests.ps1
```

