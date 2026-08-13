> **Reviewed:** 2026-07-27

> **Scope:** Sales-led packet index for moving from first-pilot proof to annual order readiness, plus the commercial conversion checklist / decision-cycle telemetry (formerly `COMMERCIAL_CONVERSION_CHECKLIST.md`), the ROI baseline SEND policy / baseline-capture checklist (formerly `ROI_BASELINE_SEND_POLICY.md`), productized service SKUs / SOW template (formerly the body of `SERVICE_LED_OFFERS.md`; that filename remains a path-stable alias for CI), paid pilot Option A/B drafts + SKU outreach talk track (formerly the body of `PAID_PILOT_OFFERS.md`; that filename remains a path-stable alias for GTM **M-22** / **M-23** / **M-34**), Upwork service listing drafts (formerly the body of `UPWORK_LISTINGS.md`; that filename remains a path-stable alias for GTM **M-24** / **M-25** / **M-26**), the transactable procurement path / legal terms packet (formerly the body of `TRANSACTABLE_PROCUREMENT_PATH.md`; that filename remains a path-stable alias), and the paid-pilot evidence ledger / ROI session / decision-delta / addendum (formerly the body of `validation/PAID_PILOT_EVIDENCE_LEDGER.md`; that filename remains a path-stable alias for CLI/UI). Not legal advice, pricing authority, or procurement attestation.

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

## Sponsor paid-pilot proof packet (assembly + mock procurement review) {#sponsor-paid-pilot-proof-packet-assembly--mock-procurement-review}

**Audience:** Founder / pilot operator / sales engineer preparing a **paid** sponsor sponsor packet and rehearsing it before a real procurement call.

**Goal:** Turn one finalized review into the six-element sponsor proof packet, then pressure-test it in a mock procurement review **before** sending. Market-validation tooling (V1 design half); running it on real authorized data is GTM backlog **M-37 (V1.1)**. Assessment Improvement **#4**.

### Six required elements → canonical owners

| # | Required element | Canonical source / command | Claim boundary |
| --- | --- | --- | --- |
| 1 | **ROI assumptions** | `sponsor-summary.json` + [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) + [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Lead with dollars only when `roiSponsorSafe=true` |
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

Market-execution (real authorized run + human mock review + [paid pilot evidence ledger](#paid-pilot-evidence-ledger)) remains **M-37**.

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
| **DEFERRED_SCOPE** | **Deferred buyer requirement** — record V1.1/V2/(B) ask; do not treat as V1 failure | Sponsor owner |
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
| Pilot start → first finalize | First-hour architect friction (see [`CORE_PILOT.md`](../CORE_PILOT.md); `FIRST_HOUR_OPERATOR_PATH.md` alias) |
| First commit → sponsor send | Proof packet / ROI baseline SEND gates ([§3](#commercial-conversion-checklist)) |
| Sponsor send → decision | Sponsor value narrative and faithfulness guardrails |

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
| **sponsor-owner** | Yes |
| **cfo-delegate** | Yes |
| **sales** / **pilot-operator** | Record only — cannot self-approve |

Place `roi-baseline-send-override.json` in the proof folder next to `go-no-go-summary.json`. Template: [`templates/roi-baseline-send-override.template.json`](templates/roi-baseline-send-override.template.json).

Required override fields:

- `approvedByRole` — `sponsor-owner` or `cfo-delegate`
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

**Related:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) (tasks M-22–M-28, M-34), [Paid pilot offers + SKU talk track](#paid-pilot-offers-draft) (`PAID_PILOT_OFFERS.md` alias — **M-22** / **M-23** / **M-34**), [Upwork listings](#upwork-listings-draft) (`UPWORK_LISTINGS.md` alias — **M-24** / **M-25** / **M-26**), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) (subscription + Addendum D conversion), [`POSITIONING.md`](POSITIONING.md), [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) (public pricing posture; **Marketing alignment Q8** companion). Private SOW + paid-offer test live below.

### Positioning guardrails

- **Primary wedge:** Evidence-backed **architecture review** for AI/cloud-era systems — not a replacement for enterprise GRC registries.
- **Avoid headline-only “AI governance platform”** — frames a crowded category; prefer **architecture evidence, review, and report** (packs may still map to NIST AI RMF / EU AI Act as *evidence for review*, not certification).
- **Stripe live / Marketplace self-serve** remains **`V1.1`** per [`V1_SCOPE.md`](../library/V1_SCOPE.md) and [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b; **service revenue does not depend** on those rails.

### Named offers (SKU menu)

Use these names in landing copy, Upwork, SOWs, and outreach so buyers purchase a **package**, not “ArchLucid” as an abstract platform.

| SKU | Buyer / use | Core deliverables (typical) | Indicative band (USD) |
|-----|-------------|-----------------------------|------------------------|
| **ArchLucid AI & Cloud Architecture Readiness Review** | Mid-market CTO, fractional CTO, cloud consultant, regulated startup needing credibility | Sponsor summary; architecture evidence inventory; decision register; risk register; policy/finding summary; recommended actions; final **Architecture Review Report** (DOCX/PDF, whitelabel as needed) | **1,500–3,000 USD** lightweight scope · **5,000–10,000 USD** standard · multi-system / team pilot — upper bands per [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) **section 5** |
| **ArchLucid Evidence Pack** | Team with scattered artifacts; needs one structured dossier before a board or ARB | Curated evidence set in-workbench + export bundle aligned to review narrative; gap list | Scope by effort — often bundled **inside** Readiness Review |
| **ArchLucid Architecture Board / ARB Report** | Sponsor needs a single sponsor- or ARB-ready artifact | Short cycle focused on **report** sections and traceability appendix; whitelabel firm/client branding | Typically **upper half** of Readiness Review band |
| **ArchLucid Cloud Governance Review (Azure-first)** | Azure-heavy estate; cost + security baseline narrative | Customer **`Get-ArchLucidAzurePackage.ps1`** ZIP ingest where applicable; security-baseline + cost-oriented findings; report | Align with **Azure Architecture Readiness** Upwork listing in [`GTM_BACKLOG.md`](GTM_BACKLOG.md) M-25 |

**Note:** Indicative bands are planning defaults for **founder-led / consulting-enabled** motion. **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)** (**Marketing alignment Q7**) still applies: **no public paid-pilot $ band on the landing page** in the first 90 days — use **walkthrough → qualify → quote** and private SOWs.

### Readiness Review engagement pack (TB-133) {#readiness-review-engagement-pack-tb-133}

Owner-reviewable before customer send. Not a legal order form. Primary motion aligns with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) and [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

#### One-page offer

ArchLucid delivers a **time-boxed architecture review** that produces a **committed, sponsor-safe proof package** on Azure workloads. The engagement uses the ArchLucid proof engine (agents + governance policy packs + audit trail) with explicit **non-certification** boundaries.

#### Buyer prerequisites

- Azure architecture evidence (topology, identity, data flows) the buyer may share under contract
- Sponsor sponsor and technical lead for a 30-minute findings review
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

After each paid engagement, run the [**decision-delta interview**](#decision-delta-interview-paid-pilots) within seven days to capture whether ArchLucid changed an approval outcome versus frontier AI alone.

### Productization learnings (after paid engagements)

After **roughly 5–10** paid reviews, reconcile:

- Evidence clients always provide vs exceptions.
- Repeated finding patterns and report sections buyers forward.
- Objections and what screenshots or exports closed trust.

Feed results into **engineering backlog** / **`GTM_BACKLOG.md` retros** and pack/report templates — **do not** expand **`V1_SCOPE.md`** breadth on speculation alone.

### Change control

When a SKU name, band, or deliverable list becomes **public** on `archlucid.net`, update **`PRICING_PHILOSOPHY.md`** / procurement templates if numbers are no longer private — and refresh **`GTM_BACKLOG.md`** notes if **Marketing alignment** posture (Q7) changes.

### Paid pilot offers + SKU talk track (M-22 / M-23 / M-34) {#paid-pilot-offers-draft}

Former standalone body: `docs/go-to-market/PAID_PILOT_OFFERS.md` → this subsection (filename kept as a path-stable alias for GTM **M-22** / **M-23** / **M-34**). Not legal advice; not a public price list. Ready for owner personalization and counsel review before customer send.

**Path-stable alias:** [`PAID_PILOT_OFFERS.md`](PAID_PILOT_OFFERS.md).

**Canonical SKU menu:** [Named offers](#productized-service-offers) above. **Service SOW shell:** [`#private-quote--sow-template`](#private-quote--sow-template). **Subscription order form:** [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) (Addendum D). **Public SaaS list prices:** [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §5 — do **not** put private service bands on the public landing page (Marketing alignment Q7).

#### SKU name lock (M-34)

Use these **exact** names in SOWs, order-form addenda, Upwork drafts, LinkedIn, and outreach. Do not invent synonyms that sound like different products.

| Short label (internal) | Buyer-facing SKU name (lock) | Typical next commercial step |
|------------------------|------------------------------|------------------------------|
| **Readiness Review** | **ArchLucid AI & Cloud Architecture Readiness Review** | Default first paid engagement; convert to Team/Professional subscription via [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) |
| **Evidence Pack** | **ArchLucid Evidence Pack** | Often bundled inside Readiness Review; standalone when procurement needs a dossier before ARB |
| **ARB Report** | **ArchLucid Architecture Board / ARB Report** | When sponsor needs one sponsor-/ARB-ready narrative |
| **Azure-first** | **ArchLucid Cloud Governance Review (Azure-first)** | Azure-heavy estates; aligns with Upwork listing **M-25** |

**Conversion path (say this consistently):**  
Readiness Review (or Azure-first) → optional Evidence Pack / ARB Report → annual **Team / Professional / Enterprise** subscription order form ([`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) + MSA/DPA).

**Do not say in outreach:** “buy ArchLucid,” “platform subscription starts at…,” or “AI governance platform” as the offer name. Name the **package**.

#### Outreach talk track (M-34)

**One-sentence offer (cold / warm):**

> We run a fixed-scope **ArchLucid AI & Cloud Architecture Readiness Review** — evidence intake through a sponsor-safe Architecture Review Report — so your next cloud/AI architecture decision has a committed package, not another slide deck.

**Qualification bridge (after interest):**

1. Name the decision the review must support in 30–60 days.
2. Confirm they can provide an architecture packet in week 1 (or accept a labeled demo-workspace path).
3. Name the sponsor who will read the export.
4. Pick **one** SKU from the lock table for the first engagement (default: Readiness Review).
5. Defer CPA SOC 2 / published pen test / Marketplace self-serve / V1.1 connectors unless separately contracted — see [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md).

**Disqualify:** Chatbot-only buyers; no sponsor; V1.1 connectors as go-live blocker before any review value. Full checklist: [`#paid-offer-test-private`](#paid-offer-test-private).

**Follow-up email skeleton — Subject:** ArchLucid Readiness Review — scoped package (not a platform tour)

```text
[Name] —

Following our conversation: the first paid step is an ArchLucid AI & Cloud Architecture
Readiness Review (fixed scope, private quote). Deliverables are an sponsor summary,
evidence inventory, risk/decision registers, and an Architecture Review Report (DOCX/PDF)
with a finalized architecture package and audit trail.

If you need a procurement dossier first, we can bundle an ArchLucid Evidence Pack.
If the sponsor needs a single board narrative, we scope an ArchLucid Architecture Board /
ARB Report instead (or after).

Next step: 20-minute scope call → private SOW for owner review → start.

Indicative private band (not a public list price): see paid-offer test in our quote packet.
SaaS subscription (Team / Professional) is a separate order form after the review proves value.
```

#### Option A — Architecture review package (M-22)

**Maps to SKU:** **ArchLucid AI & Cloud Architecture Readiness Review**  
**Optional add-ons (same SOW checkboxes):** Evidence Pack · ARB Report · Azure-first variant when the estate is Azure-primary.

**Positioning:** A **time-boxed, fixed-fee architecture review package** delivered with ArchLucid as the proof engine. Buyer purchases relief and a defensible report — not seats.

| Element | Default |
|---------|---------|
| Duration | **2–3 weeks** calendar |
| Domains | **1** architecture domain / system boundary |
| Reviews | **1** finalized architecture package (second compare optional as change order) |
| Seats during engagement | Operator seats as needed for delivery; **not** a SaaS seat sale |
| Report | Architecture Review Report (DOCX/PDF); whitelabel optional |
| Proof | Finalized package + audit trail; execution mode labeled |

**Buyer gets:** Sponsor summary; architecture evidence inventory; decision register; risk register; policy/finding summary; recommended actions; Architecture Review Report (DOCX/PDF); finalized architecture package with export/proof-packet artifacts; 30-minute findings / sponsor debrief.

**Buyer does not get (unless addendum):** SOC 2 CPA attestation; published third-party pen test; live Marketplace / Stripe self-serve; V1.1 first-party Jira/ServiceNow/Teams/Slack; guaranteed ROI dollars without buyer baselines; production remediation execution.

| Shape | Indicative USD (private) |
|-------|--------------------------|
| Narrowly bounded | **Low four figures (private band)** |
| Standard (default quote) | **Mid four figures (private band)** |
| Multi-system / team | Upper bands per [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §5 / custom |

Fill the SOW “Indicative fee” line; owner reviews every send. Source bands: [`#paid-offer-test-private`](#paid-offer-test-private).

**Acceptance criteria:** (1) Signed SOW with **Readiness Review** (or Azure-first) selected; (2) baseline capture started; (3) first finalize within **10 business days** of kickoff; (4) sponsor export reviewed in debrief; (5) payment per SOW schedule.

**Assemble customer packet:** Copy [`#private-quote--sow-template`](#private-quote--sow-template) → check Readiness Review → paste scope/exclusions → set private fee → owner sign-off → after SEND/PASS offer subscription via [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) Addendum D.

#### Option B — 30–60 day pilot (M-23)

**Maps to SKUs:** Guided delivery that **starts** as Readiness Review capacity and may include Evidence Pack / ARB Report milestones; conversion target is **Professional** (or Team) subscription + optional design-partner path ([`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §4).

**Positioning:** A **30–60 day paid pilot** with setup, demo or customer workspace, repeated review workflow, and sample/sponsor reports — still named against the SKU menu, never “unlimited platform access.”

| Element | Default |
|---------|---------|
| Duration | **30–60 days** (pick one in the SOW) |
| Setup | Tenant/workspace setup; policy-pack pin; IdP path per procurement packet |
| Workspace | Customer evidence **or** labeled demo-workspace acceptance (disclose which) |
| Reviews | Target **2–4** finalized architecture packages (name the number in the SOW) |
| Workflow | Capture → Evidence → Review → Findings → Decisions → Report with human sign-off |
| Sample reports | At least **one** sponsor-safe Architecture Review Report; optional ARB Report milestone |
| Training | One operator walkthrough + one sponsor readout |
| Conversion | Written commercial closeout → Team/Professional order form |

| Week | Milestone | SKU alignment |
|------|-----------|---------------|
| 1 | Setup complete; first scoped request; first finalize | Readiness Review kickoff |
| 2–3 | Second review or compare; Evidence Pack curated if contracted | Evidence Pack (if checked) |
| 3–6 | Sponsor report + optional ARB narrative; conversion checklist | ARB Report (if checked) |
| End | Commercial closeout (SEND/HOLD/DEFERRED_SCOPE); subscription order draft | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) |

**Private fee posture:** Prefer a **fixed pilot fee** credited toward the first annual invoice on conversion to Professional/Enterprise (guided pilot pattern in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) §4 — confirm current figure before quoting), **or** a **time-boxed package fee** in the Readiness Review upper band when consulting-shaped. Do not invent a third public list price.

**Buyer does not get (unless addendum):** Same exclusions as Option A, plus production SLA credits; unlimited architecture packages beyond the named count; design-partner discount without a confirmed slot ([`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) Addendum B).

**Acceptance criteria:** (1) Signed SOW naming Option B duration and review count; (2) setup + first finalize within **10 business days**; (3) named review count delivered (or waived in writing); (4) sponsor readout + commercial closeout filed; (5) payment per SOW; conversion order form offered within **10 business days** of pilot end.

**Assemble customer packet:** Private SOW → check Readiness Review (+ Evidence Pack / ARB Report as needed) → attach Option B scope as exhibit → state duration, review count, workspace type, fee/credit rule → owner review → on conversion complete [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) §2 + Addendum D.

#### Option A vs Option B — when to offer which

| Signal | Offer |
|--------|-------|
| Single decision / one domain / need a report in ~2–3 weeks | **Option A** (Readiness Review package) |
| Buyer wants habit + compare runs + conversion path before ARR | **Option B** (30–60 day pilot) |
| Azure ZIP / cost+security baseline is the wedge | Option A or B with **Azure-first** SKU checked |
| Procurement needs dossier before any narrative | Bundle **Evidence Pack**; keep Readiness Review as parent SKU |

#### Owner send checklist

- [ ] Exact SKU name from the lock table on the SOW
- [ ] Private fee filled; no public landing-page band
- [ ] Exclusions match [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise)
- [ ] Owner reviewed SOW before send ([`G-COMMERCE-02`](GTM_BACKLOG.md) / [commercial conversion checklist](#commercial-conversion-checklist))
- [ ] After acceptance: decision-delta interview within 7 days ([`#decision-delta-interview-paid-pilots`](#decision-delta-interview-paid-pilots))

### Upwork service listings (draft) (M-24 / M-25 / M-26) {#upwork-listings-draft}

Former standalone body: `docs/go-to-market/UPWORK_LISTINGS.md` → this subsection (filename kept as a path-stable alias for GTM **M-24** / **M-25** / **M-26**). Copy-paste ready for the Upwork freelancer/agency profile. Not a public price list; not legal advice. Owner personalizes fee, calendar, and counsel before publish.

**Path-stable alias:** [`UPWORK_LISTINGS.md`](UPWORK_LISTINGS.md).

**SKU lock:** [Paid pilot offers](#paid-pilot-offers-draft) · canonical menu [Named offers](#productized-service-offers). **Claim gates:** [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) · [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md).

| GTM | Listing title (Upwork) | Maps to SKU | Draft |
|-----|------------------------|-------------|-------|
| **M-24** | AI Architecture Governance Review | **ArchLucid AI & Cloud Architecture Readiness Review** | **Ready** (below) |
| **M-25** | Azure Architecture Readiness Review | **ArchLucid Cloud Governance Review (Azure-first)** | **Ready** (below) |
| **M-26** | Architecture Decision Record Cleanup | Readiness Review slice (capture + decision register) | **Ready** (below) |

#### M-24 — AI Architecture Governance Review

**Upwork title (≤70 chars):**

```text
AI Architecture Governance Review — Evidence-Backed Report
```

**Category / skills (suggested):** Cloud Architecture · AI / ML · Solution Architecture · Technical Writing · Risk Management. Optional: Azure, Compliance, Enterprise Architecture.

**One-line thumbnail:**

```text
Fixed-scope architecture review → committed findings, audit trail, and a sponsor-safe Architecture Review Report (not another slide deck).
```

**Full description (paste):**

```text
I deliver a fixed-scope ArchLucid AI & Cloud Architecture Readiness Review —
an evidence-backed architecture governance package you can take to a sponsor,
ARB, or security review.

What you get
• Sponsor summary of architecture risks and decisions
• Evidence inventory tied to findings (not free-floating AI opinions)
• Decision / risk registers with clear dispositions
• Policy / finding summary with recommended actions
• Architecture Review Report (DOCX/PDF; whitelabel available when scoped)
• A finalized architecture package with an audit trail you can reopen later

How it works
1. Scope call (20–30 min) — decision this review must support in 30–60 days
2. Evidence intake — docs, diagrams, exports you can share under contract
   (or a labeled demo-workspace path if we start from a synthetic sample)
3. Governed review run — multi-agent analysis + human-readable findings
4. Sponsor walkthrough — findings, limits, and next actions
5. Export handoff — report + package; optional conversion to an ongoing
   Team/Professional subscription (separate order form)

This is a packaged review outcome, not “buy an AI platform” and not a
certification engagement.

Good fit if you are
• A mid-market CTO, fractional CTO, or cloud consultant
• Preparing for an ARB / architecture board or security review
• Tired of diagram-only or chatbot reviews with no evidence trail

Not a fit if you need
• CPA-issued SOC 2 or a published third-party pen test as day-one deliverables
• Jira / ServiceNow / Teams / Slack native sync as a go-live blocker
• Public Marketplace self-serve checkout or promised savings amount claims

Pricing
Private quote after scope. Indicative bands for planning (not a public list):
lightweight low-four-figures · standard mid-four-figures · larger multi-system
pilots quoted separately. SaaS subscription is a separate commercial step
after the review proves value.

Next step
Message me with: (1) the architecture decision you need to support,
(2) cloud/AI stack in one sentence, (3) whether you have a sponsor for a
30-minute findings review. I will reply with a scoped SOW outline.
```

**Deliverables checklist (Upwork “What you’ll get”):** (1) Architecture Review Report (DOCX or PDF); (2) Finalized architecture package summary (findings + evidence links); (3) Decision / risk register excerpt; (4) 30-minute sponsor findings walkthrough; (5) Written limitations + execution-mode labels.

| Q | A |
|---|---|
| Is this ChatGPT architecture advice? | No. You get a structured package with evidence-linked findings and an exportable report. |
| Do you certify us for SOC 2 / HIPAA? | No. Outputs are architecture-review evidence, not regulator attestation. |
| Do I need Azure? | Azure-heavy estates can use the Azure-first SKU (separate listing). This listing covers general AI/cloud architecture governance. |
| Can you whitelabel? | Yes when scoped (consultant firm / client branding on the report). |

**Owner publish checklist:** Paste title + description into Upwork; set private milestone or fixed-price after scope (no SaaS list prices on the listing); attach redacted sample only if **M-93** / dogfood sample is cleared; point buyers at [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) Addendum D only after SOW close; publish on Upwork (in-repo **M-24** draft Done; marketplace go-live is owner).

#### M-25 — Azure Architecture Readiness Review

**Upwork title (≤70 chars):**

```text
Azure Architecture Readiness Review — Cost + Security Baseline
```

**Category / skills (suggested):** Microsoft Azure · Cloud Architecture · Cloud Security · Cost Optimization · Solution Architecture. Optional: Compliance, Technical Writing, Enterprise Architecture.

**One-line thumbnail:**

```text
Azure-first architecture review from your extractor ZIP → security-baseline + cost findings with an evidence trail and sponsor-safe report.
```

**Full description (paste):**

```text
I deliver a fixed-scope ArchLucid Cloud Governance Review (Azure-first) —
an Azure-heavy architecture readiness package with security-baseline and
cost-oriented findings you can take to a sponsor or cloud governance forum.

What you get
• Sponsor summary focused on Azure estate risks and decisions
• Evidence inventory tied to findings (ZIP ingest and/or shared artifacts)
• Security-baseline + cost-oriented finding set with recommended actions
• Decision / risk register excerpt with clear dispositions
• Architecture Review Report (DOCX/PDF; whitelabel available when scoped)
• A finalized architecture package with an audit trail you can reopen later

How it works
1. Scope call (20–30 min) — Azure domains in scope and the decision this
   review must support in 30–60 days
2. Evidence intake — preferred: customer Get-ArchLucidAzurePackage.ps1 ZIP
   (or equivalent exports/diagrams you can share under contract). A labeled
   demo-workspace path is available if we start from a synthetic sample
3. Governed review run — multi-agent analysis + human-readable findings
4. Sponsor walkthrough — findings, limits, and next actions
5. Export handoff — report + package; optional conversion to an ongoing
   Team/Professional subscription (separate order form)

This is a packaged Azure readiness outcome, not “buy an AI platform,” not a
Microsoft Partner certification, and not a FinOps retainer.

Good fit if you are
• Running a primarily Azure estate (Landing Zone / WAF-oriented reviews)
• Preparing for a cloud governance, security, or cost baseline conversation
• A mid-market CTO, fractional CTO, or Azure-focused consultant

Not a fit if you need
• Multi-cloud-first review with no Azure primary (use the general AI/cloud
   governance listing instead)
• CPA-issued SOC 2 or a published third-party pen test as day-one deliverables
• Native Jira / ServiceNow / Teams sync as a go-live blocker
• Promised savings amounts or invoice-accurate Azure OpenAI COGS claims

Pricing
Private quote after scope. Indicative bands for planning (not a public list):
lightweight low-four-figures · standard mid-four-figures · larger multi-subscription
estates quoted separately. SaaS subscription is a separate commercial step
after the review proves value.

Next step
Message me with: (1) the Azure decision you need to support, (2) whether you
can produce an ArchLucid Azure extractor ZIP (or what exports you have),
(3) whether you have a sponsor for a 30-minute findings review. I will reply
with a scoped SOW outline.
```

**Deliverables checklist:** (1) Architecture Review Report — Azure-first narrative; (2) Finalized package summary (security-baseline + cost-oriented findings); (3) Decision / risk register excerpt; (4) 30-minute sponsor walkthrough; (5) Written limitations + execution-mode labels.

| Q | A |
|---|---|
| Is this a Microsoft Partner assessment? | No. It is an independent architecture review package using ArchLucid on your Azure evidence. |
| Do I need the Azure extractor ZIP? | Preferred. If you cannot run it, we scope alternate exports or a labeled demo path. |
| Do you certify Landing Zone / WAF compliance? | No. Outputs are architecture-review evidence against baseline packs, not Microsoft or regulator attestation. |
| How is this different from the AI Architecture Governance listing? | This listing assumes an Azure-primary estate and emphasizes security-baseline + cost findings; the other listing is general AI/cloud governance. |
| Can you whitelabel? | Yes when scoped (consultant firm / client branding on the report). |

**Owner publish checklist:** Paste title + description into Upwork; set private milestone or fixed-price after scope; prefer a redacted Azure-path sample only if cleared; point buyers at [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) Addendum D only after SOW close; publish on Upwork (in-repo **M-25** draft Done; marketplace go-live is owner).

#### M-26 — Architecture Decision Record Cleanup

**Upwork title (≤70 chars):**

```text
Architecture Decision Record Cleanup — Evidence-Linked ADRs
```

**Category / skills (suggested):** Enterprise Architecture · Technical Writing · Solution Architecture · Knowledge Management. Optional: Cloud Architecture, Compliance, Confluence.

**One-line thumbnail:**

```text
Turn scattered ADRs and tribal decisions into a structured decision register with evidence links and a sponsor-safe cleanup report.
```

**Full description (paste):**

```text
I deliver a fixed-scope Architecture Decision Record Cleanup engagement —
a Readiness Review slice focused on capture + decisioning: your scattered
ADRs, Confluence pages, and tribal architecture decisions become a structured
decision register with evidence links you can reopen later.

What you get
• Inventory of in-scope decisions (accepted, superseded, missing, conflicting)
• Structured decision register with clear dispositions
• Evidence links from each decision back to the artifacts that justify it
• Gap list (decisions that exist only in chat/slides with no durable record)
• Short cleanup report (DOCX/PDF; whitelabel available when scoped)
• Optional path into a full ArchLucid AI & Cloud Architecture Readiness Review

How it works
1. Scope call (20–30 min) — which domain and how many decisions matter in
   the next 30–60 days
2. Intake — ADRs, Confluence/wiki exports, diagrams, prior ARB notes you can
   share under contract (or a labeled sample path if we start synthetic)
3. Capture + decisioning pass in ArchLucid — normalize, link evidence, flag gaps
4. Walkthrough — register, conflicts, and recommended next writes
5. Handoff — register excerpt + cleanup report; optional expansion to a full
   Readiness Review or subscription (separate order form)

This is a packaged decision-hygiene outcome, not “we will rewrite your entire
EA practice,” and not a certification engagement.

Good fit if you are
• Sitting on years of ADRs that nobody trusts in reviews
• Preparing for an ARB where decisions must be findable and attributable
• A mid-market CTO, fractional CTO, or consultant cleaning a client estate

Not a fit if you need
• A full multi-system architecture readiness package as day one (use the
   AI Architecture Governance Review listing)
• CPA-issued SOC 2 or published third-party pen test as deliverables
• Guaranteed migration of every historical Confluence page

Pricing
Private quote after scope. Indicative bands for planning (not a public list):
lightweight low-four-figures when narrowly bounded · larger estates quoted as a
Readiness Review upper band or Option B pilot. SaaS subscription is a separate
commercial step after the cleanup proves value.

Next step
Message me with: (1) approx how many decisions / ADRs are in scope,
(2) where they live today (repo, Confluence, slides), (3) the review or ARB
date you are aiming at. I will reply with a scoped SOW outline.
```

**Deliverables checklist:** (1) Decision register excerpt; (2) ADR / decision inventory + gap list; (3) Short cleanup report (DOCX or PDF); (4) 30-minute walkthrough; (5) Written limitations (out of scope / not migrated).

| Q | A |
|---|---|
| Will you rewrite every ADR in our wiki? | No. We scope a bounded set and produce a durable register + gap list. |
| Is this the full architecture readiness package? | It is a capture + decisioning slice. Full Readiness Review is a separate (or follow-on) SKU. |
| Do you require ArchLucid SaaS day one? | Delivery uses ArchLucid as the review workbench; subscription is optional after value is clear. |
| Can you whitelabel? | Yes when scoped. |

**Owner publish checklist:** Paste title + description into Upwork; set private milestone or fixed-price after scope; do not imply full-estate ADR migration; point buyers at [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) Addendum D only after SOW close; publish on Upwork (in-repo **M-26** draft Done; marketplace go-live is owner).

### Paid offer test (private) {#paid-offer-test-private}

Test **paid behavior** as stronger evidence than feature completion. Supports outbound and private SOW conversations without publishing new list prices.

**Offer:** ArchLucid AI & Cloud Architecture Readiness Review — fixed-scope (2–3 weeks; 1 architecture domain). **Private band:** **5,000–10,000 USD** standard; **1,500–3,000 USD** when narrowly bounded.

**Buyer gets:** sponsor summary + evidence inventory; risk register + recommended actions with evidence-basis labels; Architecture Review Report (DOCX/PDF; whitelabel); finalized architecture package with audit trail.

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
2. Sponsor summary and Architecture Review Report (DOCX/PDF), whitelabel optional.
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

## Transactable procurement path {#transactable-procurement-path}

Former standalone body: `docs/go-to-market/TRANSACTABLE_PROCUREMENT_PATH.md` → this section (filename kept as a path-stable alias). Planning and conversation guide, not a substitute for executed contracts.

**Audience:** Founder, sales engineer, and buyers' procurement teams selecting a purchase mechanism or reviewing commercial terms.  
**Path-stable alias:** [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md).

**Approval path:** Owner must review before sending legal/commercial commitments to any buyer. Items marked **"owner/legal review required"** must not be committed verbally or in product copy without that review.

### 0. Pilot vs procurement fast lane {#0-pilot-vs-procurement-fast-lane}

| Motion | Start here | Often |
|--------|------------|--------|
| **Pilot (first useful outcome)** | [`CORE_PILOT.md`](../CORE_PILOT.md) — request → pipeline → finalize → review artifacts | Same day–few days (team + environment) |
| **Internal sponsor yes/no** | Sponsor brief + scorecard | 1–4 weeks |
| **Procurement diligence** | [`trust-center.md`](trust-center.md) → [`BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator`](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator) → evidence ZIP / [`PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack`](PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack) | 2–8+ weeks |
| **Contract execution** | Templates in pack (DPA/MSA/order form) — customer legal review required | 2–8+ weeks after paper starts |

**Escalation (founder / legal / security):** contractual demand for SOC 2 Type II **attestation date** or third-party pen **vendor report** inside V1; custom DPA terms that contradict in-repo stance; multi-region active/active or rigid residency guarantees not in signed commercial terms.

**One-email sponsor kit:** [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md#12-one-email-sponsor--procurement-kit).

### 1. Purchase path decision tree

```
Start: Buyer wants to purchase
        |
        v
   Is this a pilot / service engagement
   or an ongoing subscription request?
        |
        +-- Service engagement / pilot --> Section 2.1 (Invoice / SOW)
        |
        +-- Ongoing subscription request
                |
                +-- Buyer can receive invoice --> Section 2.2 (Order form + invoice)
                |
                +-- Buyer requires Marketplace listing --> Section 2.3 (HOLD — not available)
                |
                +-- Buyer requires Stripe self-serve --> Section 2.4 (HOLD — not available)
                |
                +-- Buyer requires private offer (MACC / Azure Commitment) --> Section 2.5 (Owner decision required)
```

### 2. Purchase paths in detail

#### 2.1 Invoice / SOW (available now)

**Use for:** Pilot engagements, service-led architecture review SKUs, custom consulting scope.

| Item | Detail |
| --- | --- |
| Status | **Available** |
| Mechanism | Founder-executed SOW or service order; invoice via agreed payment method |
| Template | [`#private-quote--sow-template`](#private-quote--sow-template) |
| Payment terms | Net 30 standard; negotiable for enterprise buyers |
| Legal readiness | Draft MSA + DPA templates available; owner/legal review before execution |
| Tax readiness | Owner to confirm applicable tax registration before invoicing |
| Minimum order | No minimum; align with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) bands |
| Owner approval required | Yes — every SOW requires owner review before send |

#### 2.2 Order form + invoice (available now)

**Use for:** Annual or multi-month subscription engagements where the buyer can receive a standard invoice.

| Item | Detail |
| --- | --- |
| Status | **Available** |
| Mechanism | Founder-executed order form; invoice via agreed channel |
| Template | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) |
| Payment terms | Net 30 standard |
| Subscription billing automation | Not yet automated — manual invoice per period |
| Owner approval required | Yes — each order form requires owner review |

#### 2.3 Azure Marketplace self-serve listing

**Use for:** Buyers who require a transactable Azure Marketplace offer.

| Item | Detail |
| --- | --- |
| Status | **Not available — V1.1 / V2 roadmap** |
| Blocking dependencies | Publisher account enrollment, offer configuration, Azure commerce legal terms, pricing publication, and owner approval |
| Safe language | "We are exploring a Marketplace listing for a future release. Current purchase is invoice / order form." |
| Unsafe language | "Available on Azure Marketplace" — do not use until listing is live and approved |
| Reference | [`AZURE_MARKETPLACE_SAAS_OFFER.md`](AZURE_MARKETPLACE_SAAS_OFFER.md) (planning doc only) |

#### 2.4 Stripe self-serve checkout

**Use for:** Buyers who expect a self-serve, credit-card checkout experience.

| Item | Detail |
| --- | --- |
| Status | **Not available — V1.1 roadmap** |
| Blocking dependencies | Stripe account configuration, live key setup, checkout flow development, tax/legal compliance, owner approval |
| Safe language | "Self-serve checkout is not available yet. Pilots and subscriptions are purchased via invoice or order form." |
| Unsafe language | "Buy now" buttons or "Start free trial" flows that imply live Stripe — do not use until configured and approved |
| Reference | [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md) (planning doc only) |
| Related | [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) |

#### 2.5 Private offer / MACC draw-down (owner decision required)

**Use for:** Large enterprise buyers who want to draw down against an existing Microsoft Azure Consumption Commitment.

| Item | Detail |
| --- | --- |
| Status | **Owner decision required** — legal and technical readiness must be confirmed before offering |
| Blocking dependencies | Azure Marketplace publisher account (required for private offers), partner agreement, pricing configuration |
| Next step | Owner to confirm publisher status and partner agreement before this path is offered |
| Safe language | "We are evaluating MACC-eligible private offers. Please confirm your MACC status so we can assess feasibility." |
| Unsafe language | "You can use your MACC budget today" — do not use without confirmed publisher status |

### 3. Payment terms and legal/tax readiness

| Dependency | Current status | Owner action |
| --- | --- | --- |
| Tax registration (VAT/GST) | Owner to confirm applicability | Required before invoicing non-US buyers |
| Business entity / legal name | Owner-confirmed | Confirm legal name on all invoices |
| ACH / wire / check acceptance | Owner decision | Define accepted payment methods before first invoice |
| Currency | USD default | Owner to confirm multi-currency posture before quoting in other currencies |

### 4. Copy-guard coverage

The following phrases or UI elements in any buyer-facing material must be reviewed against this document before publication:

| Phrase / element | Guard rule |
| --- | --- |
| "Buy now" / "Purchase" / "Subscribe" buttons | Allowed only if invoice / order form path is the destination; disallowed if linking to Stripe or Marketplace that is not live |
| "Available on Azure Marketplace" | Not allowed until listing is live and owner-approved |
| "Start a free trial" with payment capture | Not allowed without owner-approved Stripe or payment configuration |
| "MACC eligible" | Not allowed without confirmed publisher status |
| Pricing listed without "contact for quote" option | Must align with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) posture |
| Any claim of "instant provisioning" or "self-serve" | Not allowed in V1; pilots require manual setup |

### 5. HOLD reasons for commercial closeout

If the commercial closeout in [`#commercial-conversion-checklist`](#commercial-conversion-checklist) reaches the purchase step and no available path fits, record as HOLD or DEFERRED_SCOPE:

| Scenario | Commercial state | Record |
| --- | --- | --- |
| Buyer requires Marketplace listing | DEFERRED_SCOPE | V1.1 roadmap; do not promise timeline |
| Buyer requires Stripe self-serve | DEFERRED_SCOPE | V1.1 roadmap; do not promise timeline |
| Buyer requires MACC draw-down | HOLD | Owner must confirm publisher status before continuing |
| Buyer cannot accept invoice | HOLD | Explore workarounds; do not improvise a payment path without owner approval |
| Tax or legal terms unresolved | HOLD | Owner must resolve before closing |

### 6. Legal and procurement terms {#legal-and-procurement-terms}

**Audience:** Founder / operator preparing for a first paid-pilot procurement conversation; buyers' legal or procurement teams reviewing commercial terms.  
Maps common term questions to current source documents (or marks draft / not yet available) and identifies owner or legal review before commitment.

#### MSA / contract terms posture

| Term area | Current status | Source | Owner action required |
| --- | --- | --- | --- |
| Master Services Agreement (MSA) template | Available — draft | [`MSA_TEMPLATE.md`](MSA_TEMPLATE.md) | Owner + buyer legal review before execution |
| SOW / quote template | Available | [`#private-quote--sow-template`](#private-quote--sow-template) | Owner review per engagement |
| Order form template | Available | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) | Owner review per engagement |
| Data Processing Addendum (DPA) | Template available | [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) | Owner + buyer legal review before execution |
| Cross-tenant patterns opt-in (DPA §10) | Template available | [`DPA_TEMPLATE.md` §10](DPA_TEMPLATE.md#10-cross-tenant-patterns-opt-in) | Owner review before execution |
| Redline owner | Founder / owner | — | Owner is the redline contact for V1 pilots |
| Legal counsel engaged | Owner decision required | — | Owner must confirm before complex enterprise redlines |

#### Data-retention commitments

| Item | Current position | Notes |
| --- | --- | --- |
| Retention period | Configurable; formal default schedule pending owner definition | Do not commit a specific retention period without owner-approved schedule |
| Deletion on contract end | Intended; exact SLA is owner-review required | Do not promise a specific deletion SLA without owner approval |
| Backup retention | Azure Blob and SQL backup retention documented in trust center | [`trust-center.md`](trust-center.md) |
| Audit log retention | Append-only; retention period is owner-defined | Do not commit a minimum audit-log retention period without owner approval |

> **Guardrail:** Do not promise specific retention periods, deletion timelines, or data-portability SLAs in product copy, demos, or verbal commitments without owner-approved language.

#### Support and SLA terms

| Item | Current position | Notes |
| --- | --- | --- |
| Pilot support posture | White-glove, founder-led | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Applies to V1 controlled pilots only |
| Support hours | Business hours (Eastern); reasonable effort response on critical issues | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Not a 24×7 enterprise SLA |
| Response time targets | Pilot SLA: P1 same business day; P2 2 business days | [`SUPPORT_POLICY.md`](SUPPORT_POLICY.md#v1-pilot-operating-model) | Draft — owner review required before commitment |
| Uptime SLA | No formal SLA in V1; reasonable-effort availability for controlled pilots | [`SLA_SUMMARY.md`](SLA_SUMMARY.md) · [`SUPPORT_POLICY.md#service-level-objectives`](SUPPORT_POLICY.md#service-level-objectives) | Do not quote a percentage SLA without owner approval |
| Support model (GA) | Not available — post-V1 | — | Do not promise GA support tier in V1 materials |

#### Liability and indemnification posture

| Item | Current position | Notes |
| --- | --- | --- |
| Limitation of liability | Standard SaaS limitation of liability in MSA template | Owner/legal review before execution; do not commit specific caps verbally |
| Indemnification scope | Standard IP indemnification in MSA template | Owner/legal review required |
| Gross negligence / willful misconduct carve-out | Included in template | Standard; owner may negotiate |
| AI output liability | ArchLucid output is decision support; operator and user remain responsible for architecture decisions | Reinforce in all materials; do not imply automated architecture approval |
| Product warranty | No warranty beyond reasonable SaaS standard; ArchLucid makes no warranty that outputs are complete, accurate, or suitable for any specific purpose | State in pilot intake |

#### Approval and commitment authority

| Commitment type | Who can commit | Process |
| --- | --- | --- |
| Pilot SOW (≤ 90 days, ≤ 25K USD) | Founder / owner | Owner review; execute via order form or SOW |
| Annual subscription | Founder / owner | Owner review; execute via order form |
| Custom MSA redline | Founder + legal counsel (recommended) | Do not accept material redlines without counsel |
| Data-retention specific SLA | Owner only | Must be owner-approved before commitment |
| Uptime SLA commitment | Owner only | Must be owner-approved; no auto-commit from product copy |
| Any SOC 2 CPA or third-party pen-test timeline | Not available | Do not commit a timeline; refer to V1.1 roadmap only |

#### Terms that must not be committed without owner approval

> Do not commit the following verbally, in product copy, in demo scripts, or in sales materials without explicit owner approval. Mark them as "owner review required" in any customer communication.

- [ ] Specific uptime SLA percentage (e.g., "99.9% uptime")
- [ ] Data deletion within a specific number of days after contract termination
- [ ] SOC 2 CPA attestation delivery date
- [ ] Third-party penetration test report delivery date
- [ ] ISO 27001 certification timeline
- [ ] Live Azure Marketplace or Stripe checkout availability date
- [ ] Named public reference customer quotes or case-study publication
- [ ] Guaranteed ROI dollar figure (vs. source-labeled estimate)
- [ ] Multi-region active/active SLA
- [ ] MCP or native connector GA dates (Jira, ServiceNow, etc.)

#### Common procurement questions and safe answers

| Question | Safe answer |
| --- | --- |
| "Can we redline your MSA?" | "Yes. We have a draft MSA template we use as a starting point. Owner review is required before accepting any material changes." |
| "What is your data retention policy?" | "Retention is configurable. A formal default schedule is in owner review. We will confirm the applicable retention period before contract execution." |
| "Do you have cyber liability insurance?" | "Owner-decision required. Do not confirm or deny coverage without owner input." |
| "Can you sign our DPA?" | "We have a DPA template as a starting point and can review your form. Owner and, for complex terms, legal counsel review is required before execution." |
| "What is your SLA?" | "V1 is a controlled pilot with founder-led white-glove support and reasonable-effort availability. A formal SLA percentage is owner-approval-required before we commit one in writing." |
| "When will SOC 2 be done?" | "SOC 2 CPA attestation is in our V1.1 backlog. We cannot commit a timeline for V1." |

Former standalone: `docs/go-to-market/LEGAL_PROCUREMENT_TERMS_PACKET.md` → this section.

---

## Paid pilot evidence ledger {#paid-pilot-evidence-ledger}

Former standalone body: `docs/go-to-market/validation/PAID_PILOT_EVIDENCE_LEDGER.md` → this section (filename kept as a path-stable alias for CLI/UI). Market-validation instrumentation only.

**Audience:** Founder / delivery lead after each paid pilot handoff and at monthly conversion review.  
**Companion JSON:** [`validation/templates/paid-pilot-evidence-ledger.template.json`](validation/templates/paid-pilot-evidence-ledger.template.json)  
**Companion UI:** Pilot ROI validation handoff card on review detail and `/value-report/pilot`.  
**ROI model:** [`PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement`](PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement) · [`../library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) (alias)  
**Execution tracked as:** GTM backlog **M-37** / **M-45 (V1.1)** — populating rows requires completed paid pilots; this template is the V1 design half.  
**Path-stable alias:** [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md).

This ledger converts the ROI narrative into **observable sponsor purchase proof**: did the pilot change a decision, what did the sponsor do next, and did conversion or expansion signals appear? It includes the [ROI validation session](#pilot-roi-validation-session), [decision-delta interview](#decision-delta-interview-paid-pilots), and [decision-change addendum](#decision-change-addendum), and complements the [commercial conversion checklist](#commercial-conversion-checklist) and [ROI baseline SEND policy](#roi-baseline-send-policy).

### When to file (paid-pilot ledger)

| Trigger | Action | Storage (local; sanitize before commit) |
| --- | --- | --- |
| Sponsor proof pack sent on a **paid** SKU | Open one ledger row within **7 days** | `artifacts/paid-pilot-ledger/<pilot-label>/ledger-row.json` |
| ROI validation session complete | Populate ledger fields from handoff-card notes | Same folder |
| Decision-delta interview complete | Merge interview outcome into `decisionChanged` | Same folder + `decision-delta.md` cross-ref |
| Conversion status changes | Update row (new `recordedUtc`) | Append status history in private notes |
| Monthly review | Roll up sanitized aggregates | Commit summary only under [`validation-runs/README.md`](validation-runs/README.md) |

Copy the JSON template per pilot. Use a **sanitized `pilotLabel`** only (e.g. `regulated-analytics-2026Q3`) — never customer legal names in committed artifacts.

### Pilot ROI validation session {#pilot-roi-validation-session}

**Audience:** Operator or founder before external sponsor handoff on a paid pilot.  
**Purpose:** Convert persisted proof signals into **observable purchase proof** — did the pilot change a decision, and can ROI claims be quoted externally without overreach? Market validation only — not new ROI math.

#### 15-minute agenda

| Minutes | Activity |
| --- | --- |
| 0–3 | Read persisted signals on the handoff card: ROI confidence, execution mode, sponsor-safe dollar gate, sendability |
| 3–10 | Walk the six validation questions (card collapsible section) with the sponsor sponsor or proxy |
| 10–13 | Decide verdict: external ROI quote vs internal directional vs hold sponsor PDF |
| 13–15 | Copy validation notes to clipboard and populate one ledger row |

#### When to use confidence tiers externally

| `roiEvidenceConfidence` | External use |
| --- | --- |
| **Strong** | May quote ROI framing **only when** execution mode is Real, dollar claims are sponsor-safe, and sendability is Sendable |
| **Partial** | Directional cycle-time / findings narrative only — no dollar savings unless buyer authorized |
| **Low** | Internal steering only — do not send sponsor PDF or quote savings |

Cross-check [`PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement`](PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement) for conservative assumptions before any external excerpt.

#### Populating the evidence ledger from the session

1. Copy [`validation/templates/paid-pilot-evidence-ledger.template.json`](validation/templates/paid-pilot-evidence-ledger.template.json) to `artifacts/paid-pilot-ledger/<pilot-label>/ledger-row.json` (local; sanitize before commit).
2. Set `runId` and `executionMode` from the handoff card (Real / Simulator / Fallback / Mixed).
3. Map interview answers to ledger fields below (`decisionChanged.*`, `baselineSourceConfidence.*`, `sponsorActionTaken.*`, `conversionSignal.status`).
4. If a decision-delta interview was run, cross-ref [decision-delta interview](#decision-delta-interview-paid-pilots).

#### Stop rules (non-negotiable)

- **Do not quote USD savings** when `projectedDollarClaimsSponsorSafe` is **false**.
- **Do not send sponsor PDF** when execution mode is not Real (unless curated demo sample with explicit internal-only labeling).
- **Do not publish** when sponsor proof readiness is DemoOnly, Incomplete, or NotSendable.
- **Do not invent dollar figures** in the ledger — record buyer authorization in private notes only.
- When ROI confidence is **Low**, treat the pilot as **internal directional** regardless of findings count.

#### Related surfaces (ROI session)

- Review detail sponsor handoff (`RunDetailSponsorBriefingSection`)
- Operator UI route `/value-report/pilot` (pilot value-report aggregate window)
- First-run operator help: `/help/first-run`

### Required fields (per pilot row)

#### 1. Pilot context

| Field | Rule |
| --- | --- |
| `pilotLabel` | Sanitized label — workload + quarter; no customer name |
| `runId` | Committed review run id (internal reference) |
| `executionMode` | `real`, `simulator`, or `mixed` — required on any external excerpt |
| `pilotContext.sku` | Align to [`#productized-service-offers`](#productized-service-offers) SKU names |
| `pilotContext.workloadCategory` | e.g. `healthcare-claims`, `iot-edge` — category only |
| `pilotContext.evidenceBasis` | `buyer-azure`, `uploaded-evidence`, or `demo-workspace-accepted` |
| `pilotContext.sponsorRole` | Role title only (e.g. `VP Architecture`) — no name |

#### 2. Baseline source confidence

| `level` | When to use |
| --- | --- |
| **high** | Buyer-reported hours with documented source note |
| **medium** | Partial baseline (some fields buyer-reported, others estimated) |
| **low** | Mostly model-default or demo-derived labels |
| **not-collected** | Explicit waiver per [`templates/paid-pilot-baseline.template.json`](templates/paid-pilot-baseline.template.json) |

| `sources[]` | Pick all that apply: `buyer-reported`, `time-study`, `model-default`, `waived` |

Record `rationale` in one sentence. Do **not** commit dollar figures unless buyer authorized external use.

#### 3. Decision changed (yes/no + why)

| Field | Rule |
| --- | --- |
| `decisionChanged.changed` | `true` only when ≥1 sponsor decision differs from counterfactual without ArchLucid |
| `decisionChanged.why` | One sentence — approval, deferral, scope change, or budget shift |
| `decisionChanged.findingIds[]` | Finding IDs that drove the change (no internal employee names) |
| `decisionChanged.decisionDeltaOutcome` | `pass`, `warn`, or `fail` per [decision-delta interview](#decision-delta-interview-paid-pilots) |
| `decisionChanged.attributionNote` | PASS requires attribution to a finding **not** in participant's manual AI pass |

#### 4. Sponsor action taken

| `action` | Meaning |
| --- | --- |
| `none` | No observable action yet |
| `approved-with-conditions` | Approved architecture path with named conditions |
| `deferred-scope` | Deferred decision; scope parked |
| `requested-evidence-pack` | Moved to Evidence Pack SKU |
| `requested-arb-report` | Moved to ARB Report SKU |
| `initiated-annual-order` | Annual Professional / Enterprise order form started |
| `declined` | Explicit no-go |

`description`: one redacted sentence. `actionUtc`: date of observable action.

#### 5. Conversion status

| Status | Meaning |
| --- | --- |
| `not-started` | Pilot not yet handed off |
| `in-pilot` | Active pilot; no sponsor send |
| `sponsor-sent` | Proof pack delivered; awaiting sponsor response |
| `evidence-pack-ordered` | Buyer selected Evidence Pack next step |
| `arb-report-ordered` | Buyer selected ARB Report next step |
| `annual-order-signed` | Annual order executed |
| `lost-deferred` | No conversion; buyer deferred or declined |

Map close-out steps from [`#commercial-conversion-checklist`](#commercial-conversion-checklist) §2–3.

#### 6. Expansion signal

| `level` | Rule |
| --- | --- |
| **none** | No second workload, team, or budget discussion |
| **watch** | Verbal interest only — no concrete next step |
| **strong** | Named second workload, team expansion, or budget increase discussed with timeline |

`signals[]`: `second-workload`, `team-expansion`, `budget-increase`, `reference-willing` (permissioned reference only).

#### 7. Blockers

`blockers[]` — record every blocker that prevented or delayed conversion. Empty array when none.

| `category` | Examples |
| --- | --- |
| `procurement` | Security review, legal, vendor onboarding |
| `soc2` | CPA attestation or trust-center gap (V1.1 backlog — do not score as V1 failure) |
| `finding-quality` | Sponsor did not trust findings enough to act |
| `pricing` | Price band mismatch |
| `connector-gap` | Workflow handoff tool missing (capture per [`GTM_BACKLOG.md`](GTM_BACKLOG.md) closed hold decisions) |
| `no-decision-change` | Outputs confirmatory only — no delta to act on |
| `champion-loss` | Sponsor or champion left |
| `other` | Named in `description` |

`deferralScope`: `v1`, `v1.1`, `v2`, or `b-procurement` — honest scope label, not a product defect claim.

### Redaction rules (mandatory)

| Allowed in committed artifacts | Never commit |
| --- | --- |
| Sanitized `pilotLabel`, workload category, SKU | Customer legal name, DBA, domain |
| Role titles, decision outcomes, status enums | Subscription IDs, tenant IDs, employee names |
| Aggregate conversion counts and blocker distributions | Unauthorized ROI dollar figures |
| Execution mode and evidence-basis labels | Raw infrastructure identifiers |

When in doubt, keep the full row in private founder storage and commit only the monthly rollup below.

### Monthly rollup (commit-safe)

After each month with ≥1 paid pilot handoff, file a sanitized summary at `validation-runs/paid-pilot-ledger-<YYYY-MM>.md`:

| Aggregate | Include |
| --- | --- |
| Pilots handed off | Count only |
| Decision-changed rate | `changed=true` / total |
| Conversion funnel | Count per `conversionStatus` |
| Top blockers | Top 3 `category` counts |
| Expansion signals | Count at `watch` + `strong` |
| Baseline confidence mix | Count per `level` |

No per-pilot quotes or names in the rollup.

### Decision-delta interview (paid pilots) {#decision-delta-interview-paid-pilots}

Founder-led interview template after a committed real-mode or labeled simulator review. Feeds `decisionChanged` on the ledger row (**M-45**).

**Also used by:** bakeoff sessions ([`DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol`](DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol)), service-led engagements ([`#productized-service-offers`](#productized-service-offers)), dismissal interview reuse ([`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#dismissal-interview-script-head-to-head`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#dismissal-interview-script-head-to-head)).

#### When to run (decision-delta)

Within **7 days** of sponsor PDF or proof-packet handoff on a **paid** Readiness Review / ARB Report SKU.

#### Capture fields

| Field | Value |
| --- | --- |
| `runId` | |
| `findingIds[]` | Findings discussed |
| `interviewer` | |
| `participantTitle` | |
| `interviewDateUtc` | |

#### Questions

1. **Counterfactual approval:** What would you have approved or deferred without ArchLucid on this packet?
2. **Changed priority:** Which finding changed severity, scope, or timeline because of ArchLucid output?
3. **Incorrect output:** Which finding was wrong or unsupported? (`findingId` + why)
4. **Frontier AI substitute:** Could Claude/GPT/Gemini on the same packet have produced an equivalent decision record? What would be missing?
5. **Repeat usage:** Will you run review #2 in ArchLucid? If no, what is the stop trigger?
6. **Budget:** Would you spend your own budget or recommend team budget? At what price band?

#### Redaction rules (buyer-safe case study)

- Remove customer name, subscription IDs, and raw infrastructure identifiers unless permissioned.
- Keep **finding category + severity + decision outcome**; drop internal employee names unless quoted with approval.
- ROI numbers only when customer authorized external use.
- Label execution mode (**Real / Simulator / Mixed**) on any exported excerpt.

#### PASS / FAIL for decision advantage

| Outcome | Criteria |
| --- | --- |
| **PASS** | ≥1 documented decision change attributable to an ArchLucid finding not present in participant's manual AI pass |
| **WARN** | Outputs confirmatory only — still valuable for packaging/audit |
| **FAIL** | Participant would not run review #2; primary reason recorded |

Store summaries under `docs/go-to-market/validation-runs/` (local; do not commit customer-identifying content without permission). Merge outcomes into the per-pilot row above. Attach a buyer-safe [decision-change addendum](#decision-change-addendum) to the proof packet when decision delta is material.

### Decision-change addendum {#decision-change-addendum}

**Audience:** Founder / delivery lead attaching decision-delta evidence to a sponsor proof packet or paid-pilot handoff.  
**Companion template:** [`validation/templates/decision-change-addendum.template.md`](validation/templates/decision-change-addendum.template.md)  
**Execution tracked as:** GTM backlog **M-45 (V1.1)** — populating with real sponsor interviews requires live handoffs; this format is the V1 design half.

This addendum bridges **technical findings** to **sponsor decisions** without inventing outcomes. It complements the proof ZIP, first-value report, and [decision-delta interview](#decision-delta-interview-paid-pilots) — it does not replace them.

#### When to attach

| Trigger | Attach to |
| --- | --- |
| Sponsor proof pack sent on a **paid** or design-partner pilot | Proof folder alongside `first-value-report.md` |
| Bakeoff session with decision-delta PASS or WARN | `artifacts/bakeoff/<label>/` next to `decision-delta.md` |
| Paid-pilot ledger row filed | Cross-ref from this ledger’s `decisionChanged` |

Copy the template per handoff. **Do not** attach externally until sponsor-safe redaction rules below are satisfied.

#### Required sections (no fabricated data)

**1. Original decision path (counterfactual)** — `counterfactualDecision`, `counterfactualBasis`, `manualAiPassSummary`. If unknown, write **`not captured`**.

**2. ArchLucid-influenced delta** — `deltaSummary`, `findingIds[]`, `deltaCategory` (`approval-changed` \| `scope-changed` \| `timeline-changed` \| `budget-changed` \| `risk-elevated` \| `confirmatory-only`), `notInManualPass` (**Y** required for PASS).

**3. Confidence and evidence references** — `confidenceLevel`, `confidenceRationale`, `evidenceRefs[]`, `executionMode`, `decisionDeltaOutcome`.

**4. Sponsor-safe caveats (mandatory)** — execution mode, ROI basis, confirmatory-only, interview timing, external quote permission.

#### Usage instructions

1. Complete the [decision-delta interview](#decision-delta-interview-paid-pilots) within **7 days** of sponsor handoff.
2. Copy [`validation/templates/decision-change-addendum.template.md`](validation/templates/decision-change-addendum.template.md) to `artifacts/paid-pilot-ledger/<pilot-label>/decision-change-addendum.md`.
3. Fill placeholders from interview answers — **never** backfill a PASS without `notInManualPass: Y` and at least one `findingId`.
4. Merge `decisionDeltaOutcome` into the ledger row when the pilot is paid.
5. For external use: strip customer names, subscription IDs, and unauthorized dollar figures.

Store full addenda locally. Commit only sanitized aggregates per [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#validation-runs-folder`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#validation-runs-folder) (`validation-runs/README.md` alias).

Former standalone: `docs/go-to-market/validation/DECISION_CHANGE_ADDENDUM.md` → this section.  
Former standalone runbook: `docs/go-to-market/validation/PILOT_ROI_VALIDATION_SESSION.md` → [Pilot ROI validation session](#pilot-roi-validation-session).

---

## Related

- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`#commercial-conversion-checklist`](#commercial-conversion-checklist)
- [`#roi-baseline-send-policy`](#roi-baseline-send-policy)
- [`#productized-service-offers`](#productized-service-offers) · [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md) (alias)
- [`#paid-pilot-offers-draft`](#paid-pilot-offers-draft) · [`PAID_PILOT_OFFERS.md`](PAID_PILOT_OFFERS.md) (alias)
- [`#upwork-listings-draft`](#upwork-listings-draft) · [`UPWORK_LISTINGS.md`](UPWORK_LISTINGS.md) (alias)
- [`#transactable-procurement-path`](#transactable-procurement-path) · [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md) (alias)
- [`#paid-pilot-evidence-ledger`](#paid-pilot-evidence-ledger) · [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md) (alias)
- [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)
- [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
- [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md)
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)
- [`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md)
