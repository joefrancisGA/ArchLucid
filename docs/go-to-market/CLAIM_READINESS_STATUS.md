> **Reviewed:** 2026-07-27

> **Scope:** Operational G1–G6 status for proof-gated GTM stages, plus the G4 proof-packet run log and operating checklist (formerly `PROOF_PACKET_RUN_LOG.md`), plus the sponsor claim / execution-mode label audit and proof-language claim audit (formerly `SPONSOR_CLAIM_LABEL_AUDIT.md`; that filename remains a path-stable CI alias). Update after each pilot or release review; not a public marketing page.

# Claim readiness status

**Current authorized stage:** Stage 0 — Controlled pilots

**Last reviewed:** 2026-07-27

## Gate table {#gate-table}

| Gate | Signal | Current status | Evidence link | Blocking dependency | Who unblocks |
| --- | --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | **PASS** | [`#sponsor-claim-and-execution-mode-label-audit`](#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias); `ExecutionModeCrossSurfaceInvariantTests`; pending harden **TB-951** (sponsor-export mode-label CI) | Spot-check one new committed run after each export formatter change; land **TB-951** before relying on formatter-only discipline | Engineering — re-run audit checklist; complete **TB-951** |
| **G2** | ROI source integrity | **PASS** | [`PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement`](PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement) (`PILOT_ROI_MODEL.md` alias), proof-packet ROI table | — | — |
| **G3** | Tenant isolation (catalog + decide-once) | **PASS** (with residuals) | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview); [`BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) (**M-114**); [`ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md`](../library/ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md) (**TB-1122**); **TB-925** Done; honesty CI **TB-1123** Done | DiD erosion honesty **TB-1233**; owner — run Claim 1 in [`BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113`](BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113) (**M-113**) | Engineering — **TB-1233**; owner — M-113 Claim 1 |
| **G4** | Repeatable proof packet | **HOLD** | [`#proof-packet-run-log`](#proof-packet-run-log) | 0 of 3 qualifying real runs logged (**G-REAL-06** / **G-REAL-07** / **M-39**) | Founder/operator — run `collect-first-pilot-proof.ps1` per real pilot |
| **G5** | Live AI evidence | **PASS** | [`artifacts/release/real-llm-evidence-gate.json`](../../artifacts/release/real-llm-evidence-gate.json) (PASS, 2026-06-25, v2 schema, 4/4 agent paths, `executionMode=real`) | RC bundle attach (**G-REAL-08**) before external full-real-mode claim on a cut | **Owner** — attach gate to next RC per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) |
| **G6** | Procurement posture honest | **PASS** | `python scripts/build_procurement_pack.py --dry-run --deal-ready`; deferred items stated in trust pack | — | — |

## Stage exit criteria

- **Stage 1 — Evidence-backed selling** is authorized when **G1–G4** are all **PASS** for **≥3** distinct real pilot runs (see [`#proof-packet-run-log`](#proof-packet-run-log)).
- **Stage 2 — Broad GTM / scale claims** requires **G1–G6** all **PASS** plus ≥1 permissioned public reference (owner-deferred per `V1_DEFERRED.md`).
- **Founder signoff required:** Movement from Stage 0 → Stage 1 requires explicit dated approval by the **founder / release owner** even when technical gates are green. Until approved, status is **HOLD_FOR_OWNER_SIGNOFF**.

## Session workflow

1. After each **real** pilot commit, complete the [operating checklist](#operating-checklist) and append a row to the [proof packet run log](#proof-packet-run-log).
2. Score gates using the readiness checklist appendix below or pilot review notes.
3. Update this table and the proof run log in the same PR or ops note.
4. Run weekly cadence when reviewing G4/G5 posture: [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md) (`.\scripts\Invoke-WeeklyProofCadence.ps1`).
5. Do not advance marketing claims past the highest fully-passed stage ([`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise)).
6. Before a principal-architect or security-reviewer tech review, run [`BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113`](BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113) (**M-113**) and hand [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) (**M-114**) plus the **TB-1122** too-strong matrix. After residual honesty CI lands (**TB-1233**; **TB-1123** Done; **TB-950** UI path when relevant, **TB-951** export CI, **TB-886** buyer verify talk track), refresh Evidence / Blocking columns here.

## G5 release-evidence workflow

`G5` is **PASS** when a current `real-llm-evidence-gate.json` reports `overallOutcome=PASS`, `executionMode=real`, and Topology, Cost, Compliance, and Critic agent paths. Last owner run: **2026-06-25** (`Invoke-RealLlmEvidenceGate.ps1` + `Invoke-ReleaseRealModeClaimGate.ps1` → `full-real-mode`). Re-run before each RC cut if the artifact is stale.

1. Generate real-mode evidence when approved credentials are available:

   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```

2. Copy `real-llm-evidence-gate.json` and `.md` into the release evidence folder before emitting the final bundle.
3. Run `.\scripts\Emit-ReleaseReadinessEvidence.ps1`; the bundle manifest reports `realModeAiEvidence.status`.
4. Keep `G5` as **HOLD** for `MISSING`, `STALE`, or `HOLD`. Use partial-real wording for `WARN`. Advance `G5` only when the release bundle reports `PASS` and the proof run log references the same artifact.

**Cross-refs:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout · tech **TB-886** / **TB-925** / **TB-948**–**TB-951** in [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md)

---

## Proof packet run log {#proof-packet-run-log}

Former standalone: `docs/go-to-market/PROOF_PACKET_RUN_LOG.md` → this section (and [operating checklist](#operating-checklist) below).

**G4 target:** ≥3 rows with **Mode = Real**, **Proof packet generated? = Yes**, **Clean = Yes**.

**Weekly rollup:** [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md)

| Run date (UTC) | Tenant | Run ID | Mode (Real/Simulator) | Proof packet generated? | Clean (no manual surgery)? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _example_ | contoso-demo | `00000000-0000-0000-0000-000000000001` | Simulator | Yes | Yes | Format reference only — replace with first real pilot row |

### Operating checklist {#operating-checklist}

#### Role ownership

| Role | Responsibility |
| --- | --- |
| **Pilot operator** | Run proof pipeline after commit; verify buyer-safe artifacts |
| **Founder / release owner** | Append log row; update G4 in the [gate table](#gate-table) |
| **Sales owner** | Block sponsor send when disposition is HOLD or log row missing |
| **Owner** | G5 real-LLM evidence (separate from G4 row discipline) |

#### Per-run checklist (real pilots only)

Complete **within 24 hours** of a committed **Real**-mode review used for GTM evidence.

##### 1. Generate proof packet

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<committed-run-guid>' `
  -SponsorHandoff `
  -FailOnHold
```

**Stop if:** exit code ≠ 0 or `go-no-go-summary.json` disposition = `HOLD`.

##### 2. Pre-send gates (all required for **Clean = Yes**)

| Gate | Pass when | HOLD trigger |
| --- | --- | --- |
| **Execution mode** | Exports label **Real** (not Simulator-only for real claim) | Unlabeled or simulator presented as live proof |
| **ROI basis** | `roiSponsorSafe = true` in go-no-go summary | Unlabeled dollar figures |
| **Sponsor disposition** | `disposition = SEND` when sponsor handoff intended | `HOLD` or missing go-no-go |
| **Manual surgery** | Proof folder usable without hand-editing findings/ROI | Required edits to make packet credible |
| **Redaction** | No customer PII, subscription IDs, or raw secrets | Identifying content present |

##### 3. Qualifying row criteria (G4)

| Column | Required value |
| --- | --- |
| Mode | **Real** |
| Proof packet generated? | **Yes** |
| Clean (no manual surgery)? | **Yes** |
| Run ID | Valid committed-run GUID |

**Does not qualify:** Simulator rows, demo-only Contoso runs, rows without proof packet, rows requiring manual surgery.

##### 4. Append log row

Add a row to the [run log table](#proof-packet-run-log) above. Keep the `_example_` simulator row only as format reference — do not count it toward G4.

##### Script output ↔ G4 column map (G-REAL-07 / WK-14)

| G4 log column | `collect-first-pilot-proof.ps1` source | Owner-manual when absent |
| --- | --- | --- |
| Run date (UTC) | Proof folder timestamp / `go-no-go-summary.json` generated time | — |
| Tenant | CLI scope / run detail tenant label in proof index | — |
| Run ID | `-RunId` parameter | — |
| Mode (Real/Simulator) | `go-no-go-summary.json` execution mode + export labels | Must be **Real** for qualifying row |
| Proof packet generated? | Exit code 0 and proof folder artifacts present | — |
| Clean (no manual surgery)? | Operator attestation in checklist §2 | **Yes** only when no hand-edits to findings/ROI |
| Notes | Policy-toggle delta (Run 2 pack ids, overlay extras), compare base run id | Run 2b overlay when FinOps/CIS extras used |

**Key flags:** `-SponsorHandoff` emits sponsor handoff bundle; `-FailOnHold` exits non-zero when disposition is HOLD. **Simulator** packets are format reference only — do not count toward G4.

##### 5. Update G4 gate

In the [gate table](#gate-table): 0–2 qualifying rows → **HOLD**; ≥3 → **PASS** (link three run IDs). Update **Last reviewed** when G4 changes.

#### Sponsor-send gate

Do **not** email sponsor PDF/ZIP until per-run checklist complete, log row appended, `go-no-go-summary.md` = **SEND**, and execution mode visible on first-value report / proof index.

#### Weekly review cadence

**When:** Same weekday each week during active pilots (recommended: Monday UTC). **Owner:** Founder / release owner.

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1
python scripts/ci/validate_weekly_proof_cadence.py --cadence-json artifacts/weekly-proof-cadence/<stamp>/weekly-proof-cadence.json
```

| Step | Action |
| --- | --- |
| 1 | Count qualifying rows (Real + Yes + Yes) |
| 2 | Reconcile with `weekly-proof-cadence.json` G4 row |
| 3 | Update G4 PASS/HOLD in the [gate table](#gate-table) |
| 4 | If G4 still HOLD, schedule next real pilot proof run |
| 5 | Record session in the [claim readiness appendix](#appendix-session-record-template) |

**Stage 1 — Evidence-backed selling** requires G1–G4 **PASS**, ≥3 qualifying rows, and founder dated signoff.

**Cross-refs:** [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)

---

## Appendix: Gate PASS/HOLD criteria

| Gate | Signal | PASS when | HOLD when | Evidence / remediation pointer |
| --- | --- | --- | --- | --- |
| **G1** | Execution-mode honesty | Every sponsor-facing surface labels `Real`, `Simulator`, `Fallback`, or `Mixed`; PilotStrict HOLD blocks unsafe forwarding | Any unlabeled or mislabeled execution mode in exports/UI | [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise); run-detail and proof-packet tests |
| **G2** | ROI source integrity | No dollar/time claim without `RoiMetricSourceKind` and freshness labels | Synthetic, stale, or missing-source ROI presented as savings | [`PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement`](PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement) (`PILOT_ROI_MODEL.md` alias); proof-packet ROI table |
| **G3** | Tenant isolation (catalog + decide-once) | Layer A catalogs + INV-001 + Search filter DiD shipped and reviewable (residual: DiD erosion **TB-1233**; honesty CI **TB-1123** Done) | Missing filters, header-only scope, or policy-pack safe-default gaps | [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview); [`ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md`](../library/ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md) (**TB-1122**) |
| **G4** | Repeatable proof packet | ≥3 distinct real committed runs produced clean, redacted, buyer-safe proof packets | Manual artifact surgery required per run | `collect-first-pilot-proof.ps1`; [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| **G5** | Live AI evidence | Credentialed real-LLM golden-cohort run archived with faithfulness floor | Simulator-only or missing real-mode evidence for AI claims | [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) — owner-run, non-CI-gating |
| **G6** | Procurement posture honest | Trust pack current; deferred items stated as deferred | Placeholder tokens, stale review dates, or implied third-party attestation | `python scripts/build_procurement_pack.py --dry-run --deal-ready` |

## Appendix: Session record template {#appendix-session-record-template}

```text
Date (UTC):
Evaluator:
Run IDs reviewed:
G1 PASS/HOLD — notes:
G2 PASS/HOLD — notes:
G3 PASS/HOLD — notes:
G4 PASS/HOLD — notes:
G5 PASS/HOLD — notes:
G6 PASS/HOLD — notes:
Highest stage authorized:
Next action:
```

## Appendix: Rollout stage exits

| Stage | Exit gate |
| --- | --- |
| **0 — Controlled pilots (now)** | Pilot path end-to-end; proof packet generates; [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) in active use |
| **1 — Evidence-backed selling** | **G1–G4** all **PASS** for ≥3 distinct real pilot runs |
| **2 — Broad GTM / scale claims** | **G1–G6** all **PASS**; ≥1 published/permissioned reference (owner-deferred) |

---

## Sponsor claim and execution-mode label audit {#sponsor-claim-and-execution-mode-label-audit}

Former standalone body: `docs/go-to-market/SPONSOR_CLAIM_LABEL_AUDIT.md` → this section (filename kept as a path-stable CI alias). Not buyer-facing.

Release audit checklist — sponsor-facing execution-mode and evidence-basis labels, plus the static buyer-facing proof-language claim audit (formerly `PROOF_LANGUAGE_CLAIM_AUDIT.md`; assessment §17 #7). Includes the 2026-06-16 send/no-send hardening review appendix.

### Unsupported-Claim Audit (Task #8) — 2026-06-18 pass

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

### Surfaces in scope

| Surface | Label fields | Test / guard |
| --- | --- | --- |
| First-value report (Markdown) | Execution mode, evidence-basis labels, ROI basis, **ROI narrative claim gate (PASS/WARN/HOLD)**, **decision delta**, **novelty confidence** | `FirstValueReportBuilderTests`, `SponsorDecisionDeltaNoveltyResolverTests`, `SponsorRoiClaimDispositionResolverTests`, `ExecutionModeCrossSurfaceInvariantTests` |
| First-value report (PDF) | Demo-only / needs-baseline watermarks, execution mode, ROI gate blocks | `SponsorFirstValuePdfGateTests`, `FirstValueReportPdfBuilderTests` |
| Value report (DOCX) | ROI narrative claim gate, HOLD suppression, LLM cost methodology | `DocxValueReportRenderer`, `ValueReportReviewCycleSectionFormatter` |
| Sponsor review packet (Markdown) | Execution mode, ROI disposition | `ExecutiveReviewPacketGoldenFixtureTests`, `SponsorExecutionModeMarkdownFormatter` (shared with first-value report) |
| Sponsor proof packet | Mode, limitations, ROI table | `SponsorEvidencePackServiceTests` |
| Review-detail trust card | Execution mode status | `RunTrustEvidenceCardBuilderTests` |
| Sponsor ROI summary | Real-mode filter, estimate caveats | `ExecutiveRoiSummaryServiceExtendedTests` |
| UI review detail / value report | Mode callouts, demo labels, sponsor PDF execution-mode block | Vitest `RunTrustEvidenceCardSection.test.tsx`, `EmailRunToSponsorBanner.test.tsx` |
| Demo preview / see-it marketing | Illustrative sample, evaluation preview, evidence-basis on sponsor summary | `DemoPreviewMarketingBody`, `SeeItMarketingBody`, `check_sponsor_evidence_label_consistency.py` |
| Why-ArchLucid pack | Citation-backed rows, illustrative baselines, sample demo embed | `why-archlucid-comparison.ts`, `WhyArchLucidPackBuilder.cs`, `check_why_archlucid_comparison_sync.py` |
| Procurement evidence packet | Deferred assurance, no over-claim buyer-safe rule | `check_claim_evidence_consistency.py`, `BUYER_SECURITY_PROCUREMENT_PACKET.md` |
| Socratic draft intake (operator) | Structural admission, LLM intake reasoning, redirect receipt, admitted draft, spawned review | Vitest `SocraticIntakeWizard.test.tsx`, `DraftIntakeClaimLabel` surfaces |
| Proof pipeline outputs | `realModeEvidenceStatus`, sponsor disposition | `collect-first-pilot-proof.Tests.ps1` |

### Rules (V1)

1. **Never** present simulator, fallback, or demo-derived output as live customer proof without explicit labels.
2. **Never** lead with projected dollar ROI when `projectedDollarClaimsSponsorSafe` is false or ROI basis is `defaulted` / `demo-derived` / `not-collected`. The first-value report **ROI narrative claim gate** emits **PASS**, **WARN**, or **HOLD** with matching comparative-language qualifiers.
3. **Always** include execution mode (Real / Simulator / Fallback / Mixed) on sponsor exports.
4. **Always** include evidence-basis badges (Evidence-backed, Estimate, Low support, Manual review required, Deferred scope) where applicable.
5. Deferred V1.1/V2 capabilities must use **Deferred scope** — not implied as shipped.
6. **Decision delta** and **novelty confidence** sections must appear on first-value Markdown exports (headings: `## Decision delta (recommended changes)`, `## Novelty confidence`).
7. Public demo / why-embed surfaces must not use **“real customer”** or **“benchmarked”** language for sample output — use **illustrative**, **sample**, or **citation-backed** instead.

### RC verification

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

**Cross-refs:** [gate table](#gate-table) G1 · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) · [`#proof-language-claim-audit-static-buyer-docs`](#proof-language-claim-audit-static-buyer-docs) (buyer-facing proof packets + demo scripts; superlative guard)

### Proof-language claim audit (static buyer docs) {#proof-language-claim-audit-static-buyer-docs}

Release audit log for **buyer-facing proof packets and demo scripts** — classifies each surface's dominant claim types and confirms no unsupported superlatives. Implements assessment **§17 #7 (Proof-language claim audit)**. Sponsor-generated *output* labels (first-value report, value DOCX, sponsor packet) are audited in the Task #8 section above; this section covers the static buyer-facing **documents**.

This audit answers one question for every buyer-facing proof packet and demo script: **is each claim labeled with the kind of backing it actually has, and are unsupported superlatives removed?** It reuses the existing claim guardrails ([`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise), the buyer-surface CI guards) and adds a tight superlative regression guard — it does not restate policy those docs own.

#### Claim-type taxonomy (canonical for §17 #7)

Five backing types. Each buyer-facing claim should be reducible to one of them; if it cannot, it is an over-claim and must be softened or labeled.

| Type | Meaning | Canonical backing layer |
| --- | --- | --- |
| **extractor-backed** | Traces to uploaded Azure extractor ZIP evidence (cost/savings cite `manifest.json` `collectionTimestamp` + schema version). | `ProofPacketSourceLabelsBuilder.cs`; board-pack posture `extractor-backed` in `sponsor-roi-board-pack-evidence-clusters.ts`. |
| **review-backed** | Traces to a finalized review's persisted findings / architecture package / audit rows. | Architecture package (API: golden manifest) + authority chain; `DIFFERENTIATION_PROOF_PACKET.md`. |
| **illustrative** | Demo-derived / sample, explicitly not a customer outcome. | `illustrative` posture; demo-proof-packet labels; [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy) (`demo-derived`). |
| **self-assessed** | Internally attested (e.g. SOC mapping), not third-party issued. | `SOC2_SELF_ASSESSMENT_2026.md`, `trust-center.md`, `PROCUREMENT_PACK_INDEX.md` (`Self-attested`). |
| **roadmap** | Deferred V1.1/V2 capability — stated as planned, never as shipped. | `V1_DEFERRED.md`; `PROCUREMENT_PACK_INDEX.md` (`Deferred`); `PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`. |

Governance overlay (orthogonal): AI output is **governed** vs **advisory** per `ai-output-governance-label.ts`; ROI dollar headlines obey the first-value **ROI narrative claim gate** (PASS/WARN/HOLD) — see Rule 2 above.

#### Audited surfaces (2026-06-27 pass)

Dominant claim types present and the labels that keep them honest. Disposition is **PASS** for all rows after this pass.

| Surface | Dominant claim types | Honest-label anchors |
| --- | --- | --- |
| `BUYER_SECURITY_PROCUREMENT_PACKET.md` | review-backed, self-assessed, roadmap | "does **not** claim", deferred assurance |
| `QUOTE_TO_PROOF_PACKET.md` | review-backed, illustrative, roadmap | ROI basis, send rule |
| `QUOTE_TO_PROOF_PACKET.md` (sponsor paid-pilot section) | extractor-backed, review-backed, self-assessed, roadmap | six-element claim-boundary column |
| `DIFFERENTIATION_PROOF_PACKET.md` | review-backed, illustrative, self-assessed | "what we do **not** claim", ROI basis labels |
| `DIFFERENTIATION_PROOF_PACKET.md` | review-backed, extractor-backed | evidence-linked comparison section |
| `EXECUTIVE_SPONSOR_BRIEF.md` | review-backed, illustrative | execution-mode + estimate caveats |
| `GENERIC_AI_BAKEOFF_PROTOCOL.md` (evidence pack sections) | review-backed, illustrative | bakeoff honesty ("where each wins") |
| `POLICY_PACK_DELTA_DEMO_SCRIPT.md` (pilot run-sheet) | review-backed, illustrative | "review evidence, not certification" |
| `POLICY_PACK_DELTA_DEMO_SCRIPT.md` | review-backed, illustrative | governance-evidence-not-certification grounding rule |
| `DEMO_QUICKSTART.md` (incl. demo scripts) | illustrative | demo/sample framing |
| `GENERIC_AI_BAKEOFF_PROTOCOL.md` | review-backed, illustrative | honest "where each wins" |
| `BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook` (incl. controlled pilot drill; `PROCUREMENT_OBJECTION_PLAYBOOK.md` alias) | self-assessed, roadmap | honest-posture answers |
| `DIFFERENTIATION_PROOF_PACKET.md` (model-seats message test) | review-backed, self-assessed | grounding rule: "do **not** claim ArchLucid always beats frontier AI" |
| `buyer-jobs/*` (demo proof shape sections) | illustrative | sample-not-customer labels |
| `templates/evidence-packet-buyer.template.md` | all five (as columns) | claim-boundary column |

**Patch this pass:** model-seats grounding rule (now in `DIFFERENTIATION_PROOF_PACKET.md`) — "Do **not** claim ArchLucid always beats frontier AI" is correct guidance; the new guard now normalizes markdown emphasis so the bolded `**not**` registers as a caveat (no copy change required). No unsupported superlatives remain in scope.

#### Superlative regression guard

`scripts/ci/check_proof_language_superlatives.py` scans the surfaces in `scripts/ci/data/proof_language_audit_scope.v1.json` for a **tight** list of unsupported superlatives (best-in-class, world-class, industry-leading, unmatched, guaranteed savings/ROI, never fails, always beats, 100% accurate, fully compliant, …). A term is flagged **only** when the line carries no caveat/backing marker (do not / without / illustrative / estimate / roadmap / source-labeled / …), and markdown emphasis is normalized first so bolded caveats still count. Common, legitimate terms (e.g. "enterprise-grade", "fastest path") are deliberately excluded to keep the guard trustworthy.

Wired into the buyer-surface bundle (`scripts/ci/run_buyer_surface_strict_guards.py`) and unit-tested in `scripts/ci/tests/test_check_proof_language_superlatives.py`.

#### Verification (proof-language)

```powershell
python scripts/ci/check_proof_language_superlatives.py
python -m pytest scripts/ci/tests/test_check_proof_language_superlatives.py
python scripts/ci/run_buyer_surface_strict_guards.py --strict
```

#### Residual (human / GTM half)

The automated guard removes unsupported superlatives and the matrix classifies dominant claim types, but **line-level sign-off on borderline comparative/ROI claims and the live buyer reaction** are market-execution. Pair this audit with the procurement objection rehearsal (`GTM_BACKLOG.md` **M-91**) when that window opens; do not treat a green scan as buyer acceptance.

Former standalone: `docs/go-to-market/PROOF_LANGUAGE_CLAIM_AUDIT.md` → this section (via former sponsor claim label audit).

### Appendix — Send/no-send hardening review (2026-06-16) {#appendix--sendno-send-hardening-review-2026-06-16}

Point-in-time follow-up confirming sponsor-facing artifact paths cannot be sent with missing execution mode, weak ROI basis, demo-derived data, or low support.

#### Surfaces reviewed

| Surface | Execution mode | ROI gate | Demo / low support | Verdict |
| --- | --- | --- | --- | --- |
| First-value report (Markdown) | ✅ Sponsor first-page table | ✅ PASS/WARN/HOLD narrative gate | ✅ Demo tenant banner | **OK** |
| Sponsor review packet (Markdown) | ✅ **Added 2026-06-16** (`## Execution mode`) | ✅ ROI claim disposition section | ⚠️ Demo run context operator-dependent | **Fixed gap** |
| Sponsor evidence pack (API) | ⚠️ Indirect via deltas/trust surfaces | Partial — process instrumentation | Demo run id explicit in response | **OK with labels** |
| Sponsor ROI summary (API) | Via trust card / run detail | ✅ Disposition resolver | Heuristic fallback → HOLD | **OK** |
| Architecture Review DOCX/PDF | ✅ Provenance footer | ✅ ROI sections | Whitelabel does not strip labels | **OK** |
| Proof pipeline (`collect-first-pilot-proof.ps1`) | ✅ `realModeEvidenceStatus` | ✅ `roiSponsorSafe`, `-FailOnHold` | ✅ BLOCK rows | **OK** |
| UI command center phase | ✅ `sponsorDisposition` | ✅ Baseline gate | ✅ Deferred scope phase | **OK** |

#### Finding (2026-06-16)

**Gap:** `ExecutiveReviewPacketComposer` exported sponsor Markdown **without** an execution-mode section, violating rule 3 above.

**Remediation:** Shared `SponsorExecutionModeMarkdownFormatter` + sponsor packet `## Execution mode` section + golden fixture / cross-surface tests.

#### Send / no-send rules (consolidated)

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

#### Verification commands

```powershell
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ExecutiveReviewPacketGoldenFixtureTests|FullyQualifiedName~ExecutionModeCrossSurfaceInvariantTests"
Invoke-Pester -Path scripts/tests/collect-first-pilot-proof.Tests.ps1
```

