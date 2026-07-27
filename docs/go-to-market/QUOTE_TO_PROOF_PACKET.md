> **Reviewed:** 2026-07-27

> **Scope:** Sales-led packet index for moving from first-pilot proof to annual order readiness, plus the commercial conversion checklist / decision-cycle telemetry (formerly `COMMERCIAL_CONVERSION_CHECKLIST.md`), the ROI baseline SEND policy / baseline-capture checklist (formerly `ROI_BASELINE_SEND_POLICY.md`), and productized service SKUs / SOW template (formerly the body of `SERVICE_LED_OFFERS.md`; that filename remains a path-stable alias for CI). Not legal advice, pricing authority, or procurement attestation.

# Quote-to-proof packet

**Audience:** founders, sales engineers, and sponsor owners after a guided Readiness Review when the buyer is ready to discuss **Evidence Pack**, **ARB Report**, or an **annual Professional / Enterprise order form**.

**Last reviewed:** 2026-07-27

**Canonical conversion checklist:** [`#commercial-conversion-checklist`](#commercial-conversion-checklist) (send/hold/defer rules).  
**Pre-pilot quote motion:** See **Pre-pilot quote pack** below (quote → pilot start).

**Prices:** link to [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) — do not duplicate list prices here unless already published.

**Readiness boundary:** Pricing discounts for trust, reference participation, or procurement friction are commercial choices. They do not mean `(A)` product readiness is blocked by SOC 2 CPA, third-party pen-test publication, live commerce, or public reference customers.

---

## Founder-led offer menu (after first credible review)

**Recommended first purchase:** Architecture Review Pilot (service-led or SaaS trial) — one finalized review with a sponsor-safe proof packet (`buyer-proof-pack` or `pilot proof-packet`). Deliverable: first-value report + proof summary + explicit limitations + trust pointer.

| Motion | Buyer gets | Proof required |
| --- | --- | --- |
| SaaS subscription (team tier) | Self-serve tenant + architect workspace | Finalized review + proof packet; demo labeled if simulator-only |
| Service-led Architecture Review | Facilitated review + export pack | Same proof packet + optional `-SponsorHandoff` rollup |
| Annual conversion | Expanded seats + governance | ROI source classification **Strong** or explicit assumption labels |

### Pilot deliverables (send gate)

- [ ] Committed run id and manifest version in proof packet
- [ ] Structural execution mode labeled (Real / Simulator / Fallback / Mixed)
- [ ] ROI lines show source kind (`CustomerProvided` vs `BenchmarkAssumption`)
- [ ] Redaction reviewed before external email
- [ ] [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) reviewed with buyer

### Procurement objections → artifacts

| Objection | Point to |
| --- | --- |
| "Is the AI real?" | [`AI_READINESS_POSTURE.md#buyer-safe-evidence-inventory`](AI_READINESS_POSTURE.md#buyer-safe-evidence-inventory) + run provenance footer |
| "What is ROI based on?" | First-value report **ROI and cost source classification** section |
| "SOC 2 / pen test?" | Trust Center + deferred assurance wording |
| "Integrations?" | V1 REST/CLI/UI/SCIM/extractor — V1.1 connectors labeled deferred |

### Next commercial action

1. Send proof packet (not a slide deck alone).
2. Schedule 30-minute decision review using **Sponsor first-page status** table.
3. Log quote follow-up SLA per internal sales workflow.

---

## When to use this packet

Use this index **after** `./scripts/collect-first-pilot-proof.ps1` (with `-RunId` when a finalized review exists) and before asking for annual conversion. Do not treat a vague demo click-through as proof — either buyer evidence or an **explicitly accepted demo workspace** must be labeled.

The proof pipeline emits a generated companion at **`quote-to-proof-packet.md`** inside the proof folder; this document is the stable buyer-safe index that row maps to.

---

## Packet checklist (first proof → quote)

| # | Artifact | Where it lives | Send rule | Owner |
| --- | --- | --- | --- | --- |
| 1 | Sponsor proof ZIP / evidence bundle | `first-pilot-evidence/` from [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) | Required for sponsor send; disposition must not be `HOLD` | ArchLucid |
| 2 | First-value report | `first-pilot-evidence/first-value-report.md` (+ optional PDF) | ROI sections must show basis labels; demo-derived values must not read as buyer outcomes | ArchLucid |
| 3 | Pilot success scorecard | [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Complete baselines or explicit `not collected` before leadership readout | Buyer + ArchLucid |
| 4 | ROI basis labels | `go-no-go-summary.json` → `roiBasisStatus`, `roiSponsorSafe` | Must be sponsor-safe before projected dollars lead the conversation | ArchLucid |
| 5 | Procurement pack status | `procurement-deal-ready-check.txt` from `python scripts/build_procurement_pack.py --dry-run --deal-ready` | **Deal-ready disposition: PASS** before procurement reviewers receive the packet | ArchLucid |
| 6 | Route/tier/policy/nav parity | `route-tier-policy-nav-parity.md` | PASS when commercial boundary changed recently | ArchLucid |
| 7 | Demo workspace validation (when demo is the evidence source) | `demo-workspace-validation.txt` from `./scripts/verify-demo-workspace.ps1` | PASS or documented HOLD before demo-led sponsor send | ArchLucid |
| 8 | Selected tier + order form pointer | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) after tier is agreed | Use only after sponsor accepts the evidence packet; prices live in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §4 | Sales owner |
| 9 | Deferred buyer requirements | `go-no-go-summary.json` → `deferredScopeReasons` | Record V1.1/V2/(B) items (SOC 2 CPA, reference customer, marketplace, MCP, connectors) without implying they block V1 proof | Sales + buyer |

---

## Annual order readiness vs deferred scope

| Class | Examples | Rule |
| --- | --- | --- |
| **Annual order readiness (V1)** | Sponsor proof ZIP, labeled ROI, scorecard baselines, procurement deal-ready PASS, route/tier/nav PASS, agreed tier + order form | May proceed to annual conversion conversation when `go-no-go-summary.json` disposition is **`SEND`** and ROI is sponsor-safe |
| **Deferred (not V1 blockers)** | CPA SOC 2 report, public reference customer, live Stripe/marketplace checkout, MCP, V1.1 ITSM/chat/docs connectors | Mark **`DEFERRED_SCOPE`** in proof when otherwise ready; do not present as missing V1 product scope |

---

## Commands (regenerate proof rows)

```powershell
./scripts/collect-first-pilot-proof.ps1 -BaseUrl https://your-api.example -RunId <runId> -SponsorHandoff
./scripts/verify-demo-workspace.ps1 -BaseUrl https://your-api.example
python scripts/build_procurement_pack.py --dry-run --deal-ready
python scripts/ci/assert_route_tier_policy_nav.py
```

---

## Readiness checklist

Use after a finalized review. Each row is PASS / WARN / HOLD / DEFERRED_SCOPE; deferred procurement items do not reduce V1 product-readiness language.

| Check | PASS when | HOLD when |
| --- | --- | --- |
| Run finalized | `run-evidence.json` shows finalized architecture package and status | Run is in progress or finalize/`commit` failed |
| Proof disposition | `quote-to-proof-readiness.json` is `PASS` | `HOLD` or demo tenant warning |
| ROI source basis | `roiBasisStatus: classified` for dollar claims | Missing, synthetic, or stale source |
| Redaction manifest | `redaction-manifest.json` is `PASS` | `NOT_APPLIED`; do not send externally |
| Execution mode | `environment.json` labels structural execution mode | Mode missing or ambiguous |
| Limitations | `limitations.md` reviewed | Skipped gates are unknown |
| Audit and traceability | Audit summary and sample IDs are present | No audit rows without a truncation explanation |

Follow up within **7 days** of quote request. PASS schedules a 30-minute sponsor review; HOLD resolves limitations first. Do not promise CPA SOC 2, a third-party pen-test report, live Marketplace/Stripe checkout, public references, or first-party ITSM/chat connectors.

## Pre-pilot quote pack

**Default first offer:** **Readiness Review** — a low-commitment route to evidence.

| Deliverable | Owner | Evidence |
| --- | --- | --- |
| Environment readiness + first finalized review | Joint | [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| First-value / sponsor report | ArchLucid | `GET …/first-value-report` |
| Pilot scorecard baseline + close-out | Joint | [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) |
| Buyer-safe evidence bundle | ArchLucid | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |

Before work starts, agree the SQL/auth or hosted-staging shape, Tier 1 Azure extractor ZIP or explicit demo acceptance, named architect and sponsor, and architect-hours baseline. The conversion route remains **Readiness Review → Evidence Pack or ARB Report → annual Professional / Enterprise order form**. Pricing is canonical in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md); use the [commercial conversion checklist](#commercial-conversion-checklist) after the first finalized review.

---

## Self-serve demo proof walkthroughs (no founder narration)

Use when the buyer needs a labeled path from sample request → finalized architecture package → explainability without a live session:

- [`../library/walkthroughs/AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only`](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only)
- [`../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only`](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only)
- [`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#demo-proof-shape-demo-derived-only`](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#demo-proof-shape-demo-derived-only) (`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` alias)
- [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) (decision explainability + trust posture)

---

## Executive paid-pilot proof packet (assembly + mock procurement review)

**Audience:** Founder / pilot operator / sales engineer preparing a **paid** executive sponsor packet and rehearsing it before a real procurement call.

**Goal:** Turn one finalized review into the six-element executive proof packet, then pressure-test it in a mock procurement review **before** sending. Market-validation tooling (V1 design half); running it on real authorized data is GTM backlog **M-37 (V1.1)**. Assessment Improvement **#4**.

### Six required elements → canonical owners

| # | Required element | Canonical source / command | Claim boundary |
| --- | --- | --- | --- |
| 1 | **ROI assumptions** | `executive-summary.json` + [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) + [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Lead with dollars only when `roiSponsorSafe=true` |
| 2 | **Freshness labels** | `go-no-go-summary.json` → `roiBasisStatus`; [`#roi-baseline-send-policy`](#roi-baseline-send-policy) | Demo-derived values must not read as buyer outcomes |
| 3 | **Cited evidence** | `provenance-references.json` + [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) | Evidence-linked claims only |
| 4 | **Disposition basis** | `go-no-go-summary.json` → `sponsorPacketDisposition` | Do not upgrade `HOLD`/`WARN` |
| 5 | **Audit timeline** | `provenance-references.json` + [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) | Ids only, no payloads or PII |
| 6 | **One remediation ticket** | ITSM outbound create → `ItsmFindingCorrelations` reference | Reference only; never paste ticket bodies with customer identifiers |

Elements 1–5 come from `archlucid sponsor-packet` / `collect-first-pilot-proof.ps1 -SponsorHandoff` ([`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md)). Element 6 is an explicit operator step.

### Assembly steps

**1 — Assemble**

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<committed-run-guid>' -SponsorHandoff -FailOnHold
```

Stop if exit code ≠ 0 or disposition = `HOLD`.

**2 — Remediation ticket (element 6)**

| Action | Detail |
| --- | --- |
| Create one ticket | `POST /v1/integrations/itsm/outbound/issues` for one committed `FindingId` |
| Capture reference | Persisted correlation id / external key — **reference only** |
| If ITSM not configured | Copy/export fallback; label element 6 **`fallback-export`** |

**3 — Pre-send gate**

- [`CLAIM_READINESS_STATUS.md#operating-checklist`](CLAIM_READINESS_STATUS.md#operating-checklist)
- [`CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16`](CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias)

**4 — Mock procurement review**

1. Hand the packet to an internal reviewer playing procurement/security.
2. Run the [controlled pilot drill](BUYER_SECURITY_PROCUREMENT_PACKET.md#controlled-pilot-drill) focused on objections **#1**, **#2**, **#8**, and real-mode AI evidence boundaries (`PROCUREMENT_OBJECTION_PLAYBOOK.md` alias).
3. Walk the six elements against the [evidence routing map](BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-routing-map).
4. Record every objection the packet could **not** answer from existing evidence.

### PASS / HOLD (mock review)

| Outcome | Criteria |
| --- | --- |
| **PASS** | All six elements present/labeled; send gate PASS; mock reviewer reaches a sponsor decision using only packet evidence; deferred `(B)` items accepted as scope |
| **HOLD** | Required element missing/unlabeled, send gate HOLD, or an objection needs a new claim |

Market-execution (real authorized run + human mock review + [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md)) remains **M-37**.

---

## Commercial conversion checklist {#commercial-conversion-checklist}

Former standalone: `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md` → this section (including [decision-cycle telemetry](#6-decision-cycle-telemetry-local-learning)).

**Audience:** founders, sales engineers, pilot champions, and sponsor owners moving from a guided Readiness Review to an Evidence Pack, ARB Report, or annual Professional / Enterprise order form. Use after first-pilot evidence exists; do not treat this as legal, pricing, or procurement attestation.

### Conversion rule

Do not ask for annual conversion from a vague demo. Ask after the buyer can point to one defensible architecture package built from their evidence or an explicitly accepted demo workspace.

### 1. Inputs confirmed before sponsor send

| Input | Required evidence | Owner |
| --- | --- | --- |
| Buyer evidence source | Tier 1 Azure extractor ZIP, uploaded evidence, or explicit demo-workspace acceptance | Buyer + ArchLucid |
| Finalized review | `runId`, architecture package id, and finalize timestamp in the first-pilot evidence bundle | ArchLucid |
| ROI baseline | Review-cycle hours, architect prep hours, and evidence assembly effort, or `not collected` labels | Buyer |
| Quality posture | PilotStrict sponsor-evidence disposition or documented quality-gate caveat | ArchLucid |
| Proof package | `go-no-go-summary.md`, `first-value-report.md`, `pilot-observability-summary.md`, and sponsor proof ZIP | ArchLucid |
| Procurement posture | `python scripts/build_procurement_pack.py --deal-ready` output or explicit note that SOC 2 CPA / third-party pen test are deferred | ArchLucid |
| Enterprise boundary posture | `python scripts/ci/assert_route_tier_policy_nav.py` passes after any route, tier, policy, or nav change | ArchLucid |
| Deployment readiness | Minimal Azure pilot checklist and data-consistency readiness are captured when this is a hosted pilot | ArchLucid |

### 2. Sponsor close-out sequence

1. Send the sponsor proof pack and first-value report.
2. Review ROI baseline labels first; do not lead with projected dollars if baselines are defaulted or demo-derived.
3. Walk through the top finding evidence chain and PilotStrict disposition.
4. Ask the sponsor to choose one next step:
   - **Evidence Pack** when procurement needs a formal artifact set.
   - **ARB Report** when the architecture review board needs a polished narrative.
   - **Annual Professional / Enterprise order form** when the pilot already met the scorecard target.
5. Record buyer blockers as evidence gaps, not sales objections.

### 3. Send / hold criteria

| Status | Criteria | Action |
| --- | --- | --- |
| Send | Buyer evidence or accepted demo is clear; quality gate is passing or caveated; **baseline completeness COMPLETE** (or approved [`#roi-baseline-send-policy`](#roi-baseline-send-policy) override); ROI basis is labeled and sponsor-safe; sponsor package exists; `roi-baseline-send-evaluation.json` → `sendEligible: true`; `-SponsorHandoff` proof run exits 0 with `-FailOnHold` | Send sponsor packet and ask for the selected next step |
| Hold | Missing `runId`, unresolved PilotStrict signals, absent proof ZIP, unlabeled or unsafe ROI basis, data-consistency HOLD, stale procurement pack, or failed route/tier/policy/nav guard | Re-run the relevant proof, procurement, or drift guard before sponsor send |
| Defer | Buyer requires SOC 2 CPA attestation, public reference customer, marketplace checkout, MCP, or V1.1 connectors before purchase | Mark as deferred scope (`DEFERRED_SCOPE` when V1 proof otherwise passes); do not imply those items are V1 prerequisites |

#### Proof disposition → next commercial action

| `sponsorPacketDisposition` / proof state | Next action | Owner |
| --- | --- | --- |
| **SEND** + `roiSponsorSafe` + procurement PASS | **ARB Report** or **Annual Enterprise order** (tier-dependent) | Sales + sponsor |
| **SEND** + procurement HOLD | **Evidence Pack** — refresh procurement pack | Procurement owner |
| **HOLD** (any BLOCK row) | **Evidence Pack** — fix remediation column in `first-pilot-command-center.md` | Pilot operator |
| **DEFERRED_SCOPE** | **Deferred buyer requirement** — record V1.1/V2/(B) ask; do not treat as V1 failure | Executive owner |
| ROI not sponsor-safe | **Evidence Pack** — collect baselines per scorecard | Buyer + ArchLucid |

Generated mapping: `commercial-next-step.json` in the proof folder (from `FirstPilotCommercialNextStep.ps1`).

### 4. Annual conversion handoff

Use [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) only after the sponsor has accepted the evidence packet and the commercial tier is clear. Map proof outputs with this packet. The guided pilot credit remains governed by [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §4; this checklist does not change pricing.

### 5. Enterprise operations preflight

Run these before a security/procurement reviewer receives the close-out packet:

```powershell
python scripts/build_procurement_pack.py --deal-ready
python scripts/ci/assert_route_tier_policy_nav.py
./scripts/collect-data-consistency-readiness.ps1 -BaseUrl https://your-api.example
```

For hosted Azure pilots, also follow [`../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md). These checks are evidence collection and drift detection; they do not create SOC 2 CPA attestation, third-party pen-test publication, or marketplace availability.

### 6. Decision-cycle telemetry (local learning) {#6-decision-cycle-telemetry-local-learning}

Track milestone timestamps from **demo complete** through **next-step decision** without CRM integration. Summaries expose cohort medians and outlier thresholds to prioritize roadmap work that improves deal motion. Local artifacts only — no PII required.

Former standalone runbook: `docs/go-to-market/DECISION_CYCLE_TELEMETRY.md` → this subsection.

#### Canonical milestones

| Event type | Meaning |
| --- | --- |
| `demo_complete` | Curated demo or CTO walkthrough finished |
| `pilot_start` | Tenant/environment provisioned for pilot work |
| `first_committed_run` | First architecture-package finalize captured (API: golden manifest commit; event name unchanged) |
| `sponsor_packet_sent` | Sponsor-facing packet shared (only when SEND-eligible) |
| `next_step_decision` | Commercial outcome recorded (`advance`, `hold`, `decline`, `unknown`) |

**Template:** [`templates/decision-cycle-events.template.json`](templates/decision-cycle-events.template.json)  
**Schema:** `archlucid.decision-cycle-telemetry.v1`  
**Storage:** one JSON file per account under `artifacts/decision-cycle/<account>/events.json` (or a combined log). Use pseudonymous `accountLabel` values.

#### Build summary report

```powershell
python scripts/ci/build_decision_cycle_telemetry.py `
  --events-json docs/go-to-market/templates/decision-cycle-events.template.json `
  --json-out artifacts/decision-cycle/sample-summary.json `
  --markdown-out artifacts/decision-cycle/sample-summary.md
```

#### Interpreting delay hotspots

- Compare per-account segment durations to cohort medians in the summary JSON.
- Segments above **2× median** are flagged as outlier thresholds in `outlierThresholdsHours`.
- Missing milestones mean the journey is incomplete — do not infer velocity from partial data.

| Hotspot segment | Typical remediation focus |
| --- | --- |
| Demo → pilot start | Procurement / environment prerequisites |
| Pilot start → first finalize | First-hour architect friction (see [`FIRST_HOUR_OPERATOR_PATH.md`](../library/FIRST_HOUR_OPERATOR_PATH.md)) |
| First commit → sponsor send | Proof packet / ROI baseline SEND gates ([§3](#commercial-conversion-checklist)) |
| Sponsor send → decision | Executive value narrative and faithfulness guardrails |

---

## ROI baseline SEND policy (V1) {#roi-baseline-send-policy}

Former standalone: `docs/go-to-market/ROI_BASELINE_SEND_POLICY.md` → this section (including [pre-pilot baseline capture](#pre-pilot-baseline-capture-operator-checklist)).

**Owner decision (2026-06-07):** Commercial **SEND** requires **COMPLETE** baseline completeness unless an approved override artifact is attached.

Machine-readable policy: [`scripts/ci/data/roi_baseline_send_policy.v1.json`](../../scripts/ci/data/roi_baseline_send_policy.v1.json).

**Human capture (kickoff):** [`#pre-pilot-baseline-capture-operator-checklist`](#pre-pilot-baseline-capture-operator-checklist).

### Baseline completeness statuses

| Status | Meaning | SEND allowed? |
| --- | --- | :---: |
| **COMPLETE** | Required baselines are sponsor-safe and non-defaulted | Yes (if other proof gates pass) |
| **PARTIAL** | Weak labels (e.g. `labeled-other`, `stale`) | No — override required |
| **DEFAULTED** | Scorecard/model defaults used | No — override required |
| **NOT_COLLECTED** | Missing, demo-derived, or explicit not-collected | No — override required |

### Minimum fields for SEND (non-defaulted)

These align with [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2 core metrics:

1. **Review cycle hours (baseline)** — wall-clock hours per review cycle.
2. **Architect hours per review (baseline)** — person-hours per review.
3. **ROI basis source** — `roiBasisStatus` must be one of:
   - `buyer-provided`
   - `uploaded-actual-or-amortized`
   - `azure-retail`
   - `classified`

**Documentation hours (baseline)** is recommended for ARB/annual conversations but **not blocking** for SEND.

When `roiBasisStatus` is in the complete set above, the proof pipeline treats required numeric baselines as collected via scorecard/proof posture (see `collect-first-pilot-proof.ps1`).

### Override authority and template

| Role | May approve override? |
| --- | :---: |
| **executive-owner** | Yes |
| **cfo-delegate** | Yes |
| **sales** / **pilot-operator** | Record only — cannot self-approve |

Place `roi-baseline-send-override.json` in the proof folder next to `go-no-go-summary.json`. Template: [`templates/roi-baseline-send-override.template.json`](templates/roi-baseline-send-override.template.json).

Required override fields:

- `approvedByRole` — `executive-owner` or `cfo-delegate`
- `recordedBy` — `sales` or `pilot-operator`
- `validForRunId` — must match proof `runId` when supplied
- `rationale` — at least 24 characters
- `acceptedRisk` — explicit claim boundary (e.g. no projected dollar ROI until baselines collected)

**Override does not clear:** proof `BLOCK` rows, `DEFERRED_SCOPE`, or procurement HOLD.

### Artifacts

| Artifact | Purpose |
| --- | --- |
| `roi-baseline-send-evaluation.json` | Machine-checked completeness + `sendEligible` |
| `quote-to-proof-readiness.json` | Includes `baselineCompletenessStatus` |
| `commercial-closeout.json` | Includes completeness + overrideApplied |

### Evaluate locally

```powershell
python scripts/ci/evaluate_roi_baseline_send.py `
  --go-no-go-summary artifacts/proof/go-no-go-summary.json `
  --json-out artifacts/proof/roi-baseline-send-evaluation.json `
  --strict-send
```

With override:

```powershell
python scripts/ci/evaluate_roi_baseline_send.py `
  --go-no-go-summary artifacts/proof/go-no-go-summary.json `
  --override-json artifacts/proof/roi-baseline-send-override.json `
  --json-out artifacts/proof/roi-baseline-send-evaluation.json
```

### Pre-pilot baseline capture (operator checklist) {#pre-pilot-baseline-capture-operator-checklist}

Collect the **minimum** buyer-provided baselines so ROI narratives can use **PASS/WARN** disposition instead of **HOLD**. Defaults are allowed but must be labeled **low-confidence estimates**.

**When to use:** Complete **before first sponsor export** when projected hours-saved or dollar ROI will appear in materials. Skip only when the sponsor packet stays qualitative with **HOLD** ROI gate accepted.

#### Pre-pilot questions (smallest set)

| # | Question | Field / store | Wording for sponsor materials |
| --- | --- | --- | --- |
| 1 | Median hours from architecture request to reviewable package today? | `reviewCycleHours` + source | "Buyer-reported baseline" or "Not collected — HOLD on % savings" |
| 2 | Architect prep hours per review (documentation, diagrams, narrative)? | `architectPrepHoursPerReview` | Label **defaulted** if team estimate |
| 3 | People involved per review cycle (optional)? | `peoplePerReview` | Context only — not a savings claim |
| 4 | Hours spent assembling evidence for ARB/governance last cycle? | `evidenceAssemblyEffort` | Strongest ROI lever when buyer-reported |
| 5 | Fully loaded architect hourly cost (optional for dollars)? | `architectHourlyCost` | Required for **projectedDollarClaimsSponsorSafe** |
| 6 | Baseline source | `buyer-reported` / `team-estimate` / `not-collected` | Always show source |
| 7 | Baseline freshness | Date captured | Stale >90d → WARN |

**Electronic capture:** Trial signup optional `baselineReviewCycleHours`; scorecard UI for full set — see [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §3.1 and [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2.

#### Sponsor-safe wording templates

**Buyer-reported (strongest)**

> "Review-cycle baseline (**X hours**) was reported by the buyer on **YYYY-MM-DD**. Comparative figures below are directional planning estimates — not audited outcomes."

**Team estimate (partial)**

> "Baseline hours (**X**) are an internal team estimate, not measured cycle time. Use qualitative time-saved language only unless ROI gate shows WARN with caveats."

**Defaulted / not collected (HOLD on dollars)**

> "ROI baseline inputs were **not collected** or use product defaults. **Do not quote** hours-saved percentages, annualized ROI, or USD savings in sponsor materials."

#### Operator steps

| Step | Action | Done |
| --- | --- | --- |
| 1 | Schedule 15-min baseline call at pilot kickoff | ☐ |
| 2 | Copy [`paid-pilot-baseline.template.json`](templates/paid-pilot-baseline.template.json) to `artifacts/paid-pilot-baseline/<label>/baseline.json` | ☐ |
| 3 | Run `.\scripts\validate-paid-pilot-baseline-readiness.ps1 -BaselinePath <path> -StrictPaidPilot` | ☐ |
| 4 | Record answers in scorecard (`/scorecard`) when electronic capture is available | ☐ |
| 5 | Confirm `projectedDollarClaimsSponsorSafe` only when buyer cost + hours are buyer-reported or approved estimate | ☐ |
| 6 | Re-run proof collection after baselines entered | ☐ |
| 7 | Verify first-value report ROI narrative gate ≠ HOLD before sponsor send | ☐ |

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<run-id>' -SponsorHandoff -FailOnHold
```

#### Disposition quick reference

| Baseline posture | ROI narrative gate | Projected dollars |
| --- | --- | --- |
| All buyer-reported + strong confidence | PASS possible | Allowed with redaction |
| Mixed / defaulted fields | WARN | Directional only |
| Demo tenant or not collected | HOLD | **Not sponsor-safe** |

---

## Productized service offers (founder-led) {#productized-service-offers}

Former standalone body: `docs/go-to-market/SERVICE_LED_OFFERS.md` → this section (filename kept as a path-stable alias for CI).

**Audience:** Founder, sales-led pilot owners, and boutique consultants using ArchLucid as **delivery infrastructure** for client-facing architecture reviews.

**Purpose:** V1 already ships **Architecture Review Report** export (DOCX/PDF), **consultant whitelabel**, **bulk evidence attach**, **default policy packs**, and **curated demo workspaces**. This section names **buyable SKUs** so GTM leads with **relief from pain** and a **defensible report**, not a platform feature tour.

**Related:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) (tasks M-22–M-28, M-34), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md), [`POSITIONING.md`](POSITIONING.md), [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) (public pricing posture; **Marketing alignment Q8** companion). Private SOW + paid-offer test live below.

### Positioning guardrails

- **Primary wedge:** Evidence-backed **architecture review** for AI/cloud-era systems — not a replacement for enterprise GRC registries.
- **Avoid headline-only “AI governance platform”** — frames a crowded category; prefer **architecture evidence, review, and report** (packs may still map to NIST AI RMF / EU AI Act as *evidence for review*, not certification).
- **Stripe live / Marketplace self-serve** remains **`V1.1`** per [`V1_SCOPE.md`](../library/V1_SCOPE.md) and [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b; **service revenue does not depend** on those rails.

### Named offers (SKU menu)

Use these names in landing copy, Upwork, SOWs, and outreach so buyers purchase a **package**, not “ArchLucid” as an abstract platform.

| SKU | Buyer / use | Core deliverables (typical) | Indicative band (USD) |
|-----|-------------|-----------------------------|------------------------|
| **ArchLucid AI & Cloud Architecture Readiness Review** | Mid-market CTO, fractional CTO, cloud consultant, regulated startup needing credibility | Executive summary; architecture evidence inventory; decision register; risk register; policy/finding summary; recommended actions; final **Architecture Review Report** (DOCX/PDF, whitelabel as needed) | **$1,500–$3,000** lightweight scope · **$5,000–$10,000** standard · multi-system / team pilot — upper bands per [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) **section 5** |
| **ArchLucid Evidence Pack** | Team with scattered artifacts; needs one structured dossier before a board or ARB | Curated evidence set in-workbench + export bundle aligned to review narrative; gap list | Scope by effort — often bundled **inside** Readiness Review |
| **ArchLucid Architecture Board / ARB Report** | Sponsor needs a single executive- or ARB-ready artifact | Short cycle focused on **report** sections and traceability appendix; whitelabel firm/client branding | Typically **upper half** of Readiness Review band |
| **ArchLucid Cloud Governance Review (Azure-first)** | Azure-heavy estate; cost + security baseline narrative | Customer **`Get-ArchLucidAzurePackage.ps1`** ZIP ingest where applicable; security-baseline + cost-oriented findings; report | Align with **Azure Architecture Readiness** Upwork listing in [`GTM_BACKLOG.md`](GTM_BACKLOG.md) M-25 |

**Note:** Indicative bands are planning defaults for **founder-led / consulting-enabled** motion. **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)** (**Marketing alignment Q7**) still applies: **no public paid-pilot $ band on the landing page** in the first 90 days — use **walkthrough → qualify → quote** and private SOWs.

### Readiness Review engagement pack (TB-133) {#readiness-review-engagement-pack-tb-133}

Owner-reviewable before customer send. Not a legal order form. Primary motion aligns with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) and [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

#### One-page offer

ArchLucid delivers a **time-boxed architecture review** that produces a **committed, sponsor-safe proof package** on Azure workloads. The engagement uses the ArchLucid proof engine (agents + governance policy packs + audit trail) with explicit **non-certification** boundaries.

#### Buyer prerequisites

- Azure architecture evidence (topology, identity, data flows) the buyer may share under contract
- Executive sponsor and technical lead for a 30-minute findings review
- Agreement that outputs are **architecture-review evidence**, not regulator attestation

#### Week 1 / week 2 outcomes

| Week | Buyer-visible outcomes |
| --- | --- |
| **Week 1** | Scoped architecture request, first finalized review, limitations + execution mode labeled |
| **Week 2** | Sponsor proof packet, governance summary, quote-to-proof readiness checklist, commercial closeout next step |

#### Proof outputs (from platform)

- Finalized architecture package and `pilot proof-packet` folder
- `governance-outcome-summary`, `audit-evidence-summary`, `policy-pack-freshness`
- `quote-to-proof-readiness` and `commercial-closeout` artifacts
- Optional: procurement deal-ready classification when buyer procurement is in scope

#### Exclusions (do not promise)

- SOC 2 CPA attestation, third-party pen-test publication, public reference logo
- Live Marketplace / Stripe self-serve unless explicitly enabled for the tenant
- V1.1 connectors (Jira, ServiceNow, Teams, Slack) unless separately contracted
- Multi-tenant load-test SLA or production AI certification

#### Pricing bands (owner-reviewable)

| Motion | Indicative list | Notes |
| --- | --- | --- |
| Guided pilot | See PRICING_PHILOSOPHY §4 | Credited toward Professional/Enterprise on conversion |
| Professional tier | Link PRICING_PHILOSOPHY | After PASS proof + tier-fit validation |
| Custom enterprise | Negotiated | Order form + procurement pack |

#### Order-form path

1. PASS proof disposition on quote-to-proof readiness
2. Agree tier via [`tier_fit_validation_matrix.v1.json`](../../scripts/ci/data/tier_fit_validation_matrix.v1.json)
3. Execute [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)

#### Next step after proof

Use `commercial-closeout.json` **recommendedNextAction** — typically schedule sponsor review, then quote request for Team/Professional expansion. See [commercial conversion checklist](#commercial-conversion-checklist).

### Delivery stack (what ArchLucid is in this motion)

1. Evidence intake (including bulk attach within V1 limits — disclose **up to 200 files** per multipart request; **ZIP archives count as one file** and expand server-side).
2. Structured review in the operator workflow (Capture → Evidence → Review → Findings → Decisions → Report).
3. AI-assisted analysis with **human** architecture judgment and sign-off framing in exports.
4. Traceable findings and **exportable** DOCX/PDF.

After each paid engagement, run the [**decision-delta interview**](validation/PAID_PILOT_EVIDENCE_LEDGER.md#decision-delta-interview-paid-pilots) within seven days to capture whether ArchLucid changed an approval outcome versus frontier AI alone.

### Productization learnings (after paid engagements)

After **roughly 5–10** paid reviews, reconcile:

- Evidence clients always provide vs exceptions.
- Repeated finding patterns and report sections buyers forward.
- Objections and what screenshots or exports closed trust.

Feed results into **engineering backlog** / **`GTM_BACKLOG.md` retros** and pack/report templates — **do not** expand **`V1_SCOPE.md`** breadth on speculation alone.

### Change control

When a SKU name, band, or deliverable list becomes **public** on `archlucid.net`, update **`PRICING_PHILOSOPHY.md`** / procurement templates if numbers are no longer private — and refresh **`GTM_BACKLOG.md`** notes if **Marketing alignment** posture (Q7) changes.

### Paid offer test (private) {#paid-offer-test-private}

Test **paid behavior** as stronger evidence than feature completion. Supports outbound and private SOW conversations without publishing new list prices.

**Offer:** ArchLucid AI & Cloud Architecture Readiness Review — fixed-scope (2–3 weeks; 1 architecture domain). **Private band:** **$5,000–$10,000** standard; **$1,500–$3,000** when narrowly bounded.

**Buyer gets:** executive summary + evidence inventory; risk register + recommended actions with evidence-basis labels; Architecture Review Report (DOCX/PDF; whitelabel); finalized architecture package with audit trail.

**Buyer does not get (unless separately contracted):** SOC 2 CPA / third-party pen test; V1.1 connectors; Marketplace self-serve / MCP; guaranteed ROI dollars without buyer baselines.

#### Qualification (first call)

1. What decision must this review support in 30–60 days?
2. What architecture packet can you provide in week 1?
3. Who signs off on findings / needs the sponsor export?
4. Live Azure OpenAI required, or labeled simulator OK for phase 1?
5. Baseline for review-cycle hours / prep effort?
6. Deferred requirements to label (CPA SOC 2, pen test, connectors)?

**Disqualify:** chatbot-only buyers; no sponsor; V1.1 connectors as go-live blocker before any review value.

#### Paid acceptance criteria

Signed SOW/order form; baseline capture started; first finalize within 10 business days; sponsor export reviewed; 30-min debrief; payment per order form. **GTM success signal:** ≥2 paid reviews with ≥1 second-review/compare within 90 days.

### Private quote / SOW template {#private-quote--sow-template}

**Not legal advice.** Counsel must review before customer signature. Default SKU: Readiness Review.

#### Parties

| Field | Value |
| --- | --- |
| **Customer** | __________________ (legal entity) |
| **Customer contact** | __________________ |
| **Vendor** | ArchLucid (vendor legal entity per MSA/order form) |
| **Effective date** | __________________ |
| **SOW ID** | __________________ |

#### Selected SKU

| SKU | Selected |
| --- | --- |
| **ArchLucid AI & Cloud Architecture Readiness Review** (default) | ☐ |
| ArchLucid Evidence Pack (add-on / bundled) | ☐ |
| ArchLucid Architecture Board / ARB Report | ☐ |
| ArchLucid Cloud Governance Review (Azure-first) | ☐ |

**Indicative fee (private):** $__________________ USD (planning bands above — **not** a public list price).

#### In scope

1. Structured architecture review in ArchLucid (evidence intake, findings, decisions, export).
2. Executive summary and Architecture Review Report (DOCX/PDF), whitelabel optional.
3. Evidence inventory, decision register, risk register, recommended actions.
4. Human judgment and sign-off framing; AI-assisted analysis labeled by execution mode.
5. Buyer-safe proof disposition per [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) where applicable.

#### Out of scope (unless addendum)

SOC 2 CPA / third-party pen-test publication; production SLA unless MSA exhibit; PHI / clinical systems; live Stripe self-serve; guaranteed ROI without labeled source data; production remediation execution; custom connector development.

#### Customer inputs

Up to **200 files** per multipart upload (ZIP counts as one file); optional Azure extractor ZIP or demo-workspace acceptance; named sponsor + technical contact; IdP/access per [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview).

#### Acceptance

1. Final Architecture Review Report in agreed format.
2. Finalized architecture package with audit trail and export bundle.
3. Execution mode labeled on sponsor-facing artifacts.
4. No claims beyond [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).

Customer written approval within __________ business days of delivery (or deemed accepted per MSA).

#### Fees and signatures

| Item | Amount |
| --- | --- |
| Fixed fee | $__________________ |
| Expenses | ☐ None  ☐ Pre-approved: __________________ |
| Payment | ☐ 50/50 signature/acceptance  ☐ Net __________ |

| Customer | Vendor |
| --- | --- |
| Name / Title / Date | Name / Title / Date |

---

## Related

- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`#commercial-conversion-checklist`](#commercial-conversion-checklist)
- [`#roi-baseline-send-policy`](#roi-baseline-send-policy)
- [`#productized-service-offers`](#productized-service-offers) · [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md) (alias)
- [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)
- [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
- [`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md)
