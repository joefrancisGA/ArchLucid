> **Scope:** Contributor-reference — when Simulator-derived ROI or savings dollars are forbidden vs estimate-only on sponsor-facing surfaces (TB-983); not a buyer assurance attestation.

# Simulator-derived ROI / savings sponsor forbid contract (TB-983)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — execution mode ≠ ROI source; Simulator dollars are illustrative unless explicitly labeled and sponsor-safe.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#simulator-roi-sponsor-forbid-m-139) (GTM **M-139**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-138**).  
**Send policy:** [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy) (`ROI_BASELINE_SEND_POLICY.md` alias).  
**Label audit:** [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias) Rule 2.  
**Faithfulness rollup:** [`REAL_MODE_FAITHFULNESS_ROLLUP.md`](../quality/REAL_MODE_FAITHFULNESS_ROLLUP.md).  
**Execution mode:** [`INV002_EXECUTION_MODE_AGGREGATION_CONTRACT.md`](INV002_EXECUTION_MODE_AGGREGATION_CONTRACT.md) · Done **TB-239** / **TB-971**.

---

## Decision in one line

Never present Simulator, demo, Fallback, Mixed-without-Real-savings, HOLD-baseline, or unlabeled projected dollars as **customer-realized savings** on sponsor-facing or buyer-polished surfaces. External send and leading USD headlines require Real execution (or approved curated-sample override), COMPLETE baselines, `projectedDollarClaimsSponsorSafe`, and ROI narrative **PASS** or qualified **WARN** — not **HOLD**.

---

## Forbidden as realized / buyer-specific savings

| Posture | Rule |
|---------|------|
| Demo tenant | No sponsor USD that reads as customer savings (`isDemoTenant` / demo-only proof posture) |
| ROI basis `demo-derived` / `not-collected` / `defaulted` | No leading projected USD; HOLD narrative |
| ROI narrative gate **HOLD** | `SponsorRoiClaimDisposition.Hold` — no comparative savings lead line |
| Unlabeled Simulator / Fallback / Mixed | Execution mode must be disclosed; Simulator portion is not Real proof |
| `projectedDollarClaimsSponsorSafe` = false | UI/exports must not lead with annualized/projected USD |
| Real-mode AI / faithfulness proof | Simulator output is inadmissible for sponsor correctness claims |
| Commercial SEND without COMPLETE baselines | Per ROI baseline SEND policy — HOLD unless approved override |
| External sponsor PDF when mode blocks | `isExternalSponsorPdfBlockedForExecutionMode` (Simulator / Fallback / Mixed / Real→Simulator fallback) |

**Never** lead sponsor readouts with projected USD when `projectedDollarClaimsSponsorSafe` is false.

---

## Allowed as labeled estimate / qualitative only

| Posture | Rule |
|---------|------|
| Execution mode disclosed | Simulator / Mixed labeled on every sponsor export |
| Disposition **WARN** | Estimate wording + basis qualifiers (`SponsorRoiClaimDispositionRules`) |
| Internal operator walkthroughs | May show Simulator estimates with clear mode + basis labels |
| Sponsor history footnotes | Prefer `RealModeSavingsUsd` for Real portion (Done **TB-239**); Simulator slice labeled illustrative |
| Qualitative value narrative | Time-to-review, governance throughput — without unlabeled $ |
| Curated sample override | Only when explicitly scoped as sample / not customer-realized |

---

## Language ladder (forbidden vs safe)

| Source | Allowed | Forbidden |
|--------|---------|-----------|
| Simulator / demo / HOLD | “Illustrative estimate / not customer-realized” | “Saved $X” / “customer ROI” / “proven savings” |
| Real + sponsor-safe baselines | “Estimated from tenant baselines” + source label | Unlabeled guaranteed $ |
| External send | Real + COMPLETE baselines per SEND policy | Simulator-as-production savings |

---

## Shipped gates (consume; do not reopen)

| Surface | Component | Behavior |
|---------|-----------|----------|
| First-value Markdown/PDF | `SponsorFirstValuePdfGate`, `SponsorRoiClaimDispositionResolver` | PASS/WARN/HOLD + PDF blocks for demo/HOLD |
| Value DOCX | `DocxValueReportRenderer` + disposition rules | HOLD suppresses annualized USD section |
| ROI evidence Markdown | `RoiEvidenceCompletenessMarkdownFormatter` | Disposition-qualified lead lines |
| Email-to-sponsor PDF | `isExternalSponsorPdfBlockedForExecutionMode` | Blocks external PDF for non-Real modes |
| Pilot proof API | `projectedDollarClaimsSponsorSafe` on `roiBaselineInputs` | Server-side sponsor-safe flag |
| CLI commercial readiness | `PilotProofPacketCommercialReadinessBuilder` | Reads `projectedDollarClaimsSponsorSafe` |

Done **TB-239** exposes `RealModeSavingsUsd` on sponsor ROI history for Real-mode slice separation.

---

## Known gaps (**TB-984** enforcement targets)

| Gap | Current behavior | **TB-984** owner |
|-----|------------------|------------------|
| Sponsor ROI headline | `ExecutiveRoiSummaryService.TotalEstimatedUsdSavings` sums Simulator+Real | Prefer `RealModeSavingsUsd` or hide USD on buyer-polished surfaces |
| Buyer trend chart | `ExecutiveRoiTrendSection` may plot Simulator-inclusive USD (**BDA-069**/**BDA-070**) | Real-only headline bars or labeled estimate |
| Email-to-sponsor badge | Projected-USD badge can show while PDF blocked for mode | Suppress badge when PDF blocked / `projectedDollarClaimsSponsorSafe` false / HOLD |
| Board pack / digest | `ExecutiveRoiBoardPackMarkdownBuilder`, `GovernanceDigestDecisionNeededComposer` | Align headline with forbid table |

Document asymmetry honestly until **TB-984** lands — do not claim “PDF and Email always match.”

---

## Explicit non-claims

- Do **not** say Simulator savings are customer-realized ROI.
- Do **not** conflate execution mode with ROI source (Real mode required for Real-dollar proof).
- Do **not** lead external sponsor packets with HOLD-baseline or demo-derived dollars.
- Do **not** treat `TotalEstimatedUsdSavings` as sponsor-safe Real proof when the period includes Simulator runs.
- Do **not** close honesty CI (**TB-985**) or buyer-trend fixes (**TB-984**) by publishing this contract alone.

---

## Residuals / failure modes (honest)

| Residual | Why it still matters | Owner |
|----------|----------------------|-------|
| Aggregated headline USD | Simulator runs inflate sponsor-facing totals | **TB-984** |
| Email badge vs PDF | Mode block on PDF but not badge | **TB-984** |
| Formatter-only discipline | Copy regressions without CI | **TB-985** |
| Mixed period roll-up | Real + Simulator in one window | **TB-239** / **TB-971** / **TB-984** |

---

## Follow-on / CI anchors (**TB-985**)

| Anchor | Purpose |
|--------|---------|
| This contract + M-139 one-pager | Required cite near Simulator ROI / sponsor-dollar language |
| `ExecutionModeCrossSurfaceInvariantTests` / `SponsorArtifactCrossSurfaceConsistencyTests` | Simulator-only + HOLD: no leading annualized/projected USD |
| `scripts/ci/check_sponsor_evidence_label_consistency.py` | Forbid anchors from decision table |
| `SponsorFirstValuePdfGateTests`, `SponsorRoiClaimDispositionResolverTests` | Existing PASS/WARN/HOLD gates |
| Verification | Extend cross-surface tests per **TB-985**; do not duplicate **TB-984** enforcement here |

---

## Related

- GTM **M-138** / **M-139** / **M-113** Claim-3
- Done **TB-239** / **TB-971** (execution-mode honesty)
- Open **TB-984** (enforcement) · **TB-985** (CI regression)
- Weekly drift **H3** in [`WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md`](WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md)
- [`WHAT_NOT_TO_PROMISE.md`](../go-to-market/WHAT_NOT_TO_PROMISE.md) · [`PILOT_ROI_MODEL.md`](../go-to-market/PILOT_ROI_MODEL.md)
