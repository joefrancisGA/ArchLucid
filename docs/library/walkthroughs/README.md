> **Reviewed:** 2026-07-28

> **Scope:** V1 **Specialty** accelerator template index — buyer-recognizable walkthroughs and outcome-led buyer-job pages, plus the Specialty buyer-job / demo-proof index and TB-114 job→accelerator map (formerly the body of `docs/go-to-market/buyer-jobs/README.md`; that filename remains a path-stable alias). The **Core** first-pilot path is canonical; these templates do not replace it. In-app help at `/help/specialty-walkthroughs` renders the specialty template catalog UI.

# Specialty accelerator templates (V1)

**Audience:** Sales engineers, architects, and sponsors evaluating a **vertical or posture-specific** first review without V1.1 connectors.

**Core spine (start here):** [Your first architecture review](../../CORE_PILOT.md) — the canonical workflow every tenant completes for first value. **Specialty** rows below add a named buyer narrative when the buyer’s job matches; they are **not** mandatory checklists before first finalize.

Each Specialty template follows the same shipped sequence — **capture → evidence → policy packs → findings → finalize → sponsor export** — and produces a **sponsor artifact** (architecture package / proof ZIP) at the end.

---

## Specialty catalog

| Template | Buyer question (one line) | Outcome page | Architect walkthrough | Sponsor artifact |
|------|---------------------------|--------------|----------------------|------------------|
| **Azure SaaS readiness** | Does our Azure SaaS posture hold up on WAF and security-baseline themes? | [AZURE_SAAS_READINESS.md](../../go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md) (alias) · [#buyer-job-packaging](AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging) | [AZURE_SAAS_READINESS_REVIEW.md](AZURE_SAAS_READINESS_REVIEW.md) | Architecture package + sealed review record |
| **AI governance** | Can we show Responsible AI governance on a real architecture package? | [AI_GOVERNANCE_REVIEW.md](../../go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md) (alias) · [#buyer-job-packaging](AI_GOVERNANCE_REVIEW.md#buyer-job-packaging) | [AI_GOVERNANCE_REVIEW.md](AI_GOVERNANCE_REVIEW.md) | Responsible AI review export + governance disposition |
| **Healthcare claims (demo)** | How does PHI-minimization policy land on findings before finalize? | [POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging) (`buyer-jobs/` alias) | [POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) | Policy-backed architecture package + audit trail |

**Grounding rule:** No Specialty template requires **Jira**, **ServiceNow**, **Confluence**, **Teams**, **Slack**, **MCP**, live commerce, or outbound webhooks for V1 pilot success — see [`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md).

---

## Buyer jobs Specialty index {#buyer-jobs-specialty-index}

Former standalone body: `docs/go-to-market/buyer-jobs/README.md` → this section (filename kept as a path-stable alias; formerly also the demo-proof-packets index). Outcome-led Specialty buyer-job pages linked from accelerator walkthroughs — not the Core first-pilot operator path.

**Path-stable alias:** [`go-to-market/buyer-jobs/README.md`](../../go-to-market/buyer-jobs/README.md).

| Buyer job | Doc | Demo proof shape |
| --- | --- | --- |
| Azure SaaS readiness | [AZURE_SAAS_READINESS.md](../../go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md) (alias) · [#buyer-job-packaging](AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging) | [#demo-proof-shape-demo-derived-only](AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only) |
| AI governance | [AI_GOVERNANCE_REVIEW.md](../../go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md) (alias) · [#buyer-job-packaging](AI_GOVERNANCE_REVIEW.md#buyer-job-packaging) | [#demo-proof-shape-demo-derived-only](AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) |
| Healthcare claims (demo) | [HEALTHCARE_CLAIMS_POLICY_REVIEW.md](../../go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md) (alias) · [#buyer-job-packaging](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging) | [#demo-proof-shape-demo-derived-only](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#demo-proof-shape-demo-derived-only) |

**Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · this Specialty catalog · first-run simulator script [`DEMO_QUICKSTART.md`](../../go-to-market/DEMO_QUICKSTART.md#first-run-demo-script-simulator)

Use demo proof shapes **before** a buyer runs their own tenant to show package shape, evidence labels, and deferred boundaries (**Demo-derived** only — not customer outcomes). Formerly under `demo-proof-packets/`.

### Job → accelerator map (TB-114) {#job-accelerator-map}

| Buyer job | Accelerator / proof shape | Prerequisites | Limitations |
| --- | --- | --- | --- |
| First sponsor artifact in 20 minutes | [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed) + `archlucid pilot proof-packet` | API + SQL + auth mode; one committed run | Simulator vs real must be labeled; see [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) |
| Azure SaaS procurement questions | [walkthrough demo proof](AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only) | Hosted pilot profile lint PASS/HOLD snapshot | Not a CPA SOC 2 report |
| Responsible AI / governance review | [walkthrough demo proof](AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) | Policy pack + PilotStrict posture on run | Not third-party model audit |
| Healthcare claims (demo only) | [walkthrough demo proof](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#demo-proof-shape-demo-derived-only) | Demo workspace only | **Demo-derived** — not a customer outcome |
| Differentiation vs generic copilots | [`DIFFERENTIATION_PROOF_PACKET.md`](../../go-to-market/DIFFERENTIATION_PROOF_PACKET.md) | Committed run + audit sample | Does not replace live reference customer |
| Full first-pilot rollup | `scripts/collect-first-pilot-proof.ps1 -RunId <id>` | RunId after commit; optional `-ProductionLikeHostedPilot` | Secrets never written into proof folder |

---

## Architecture intelligence (closed-loop demo)

| Template | Buyer question (one line) | Walkthrough |
|------|---------------------------|-------------|
| **Architecture intelligence golden path** | Can we show evidence-gated architecture reasoning end-to-end before Core finalize? | [ARCHITECTURE_INTELLIGENCE_GOLDEN_PATH.md](ARCHITECTURE_INTELLIGENCE_GOLDEN_PATH.md) |

---

## When to use which doc

| Need | Read |
|------|------|
| **Core** path from zero to first finalized package | [Your first architecture review](../../CORE_PILOT.md) · [`CORE_PILOT.md`](../../CORE_PILOT.md) |
| ArchitectureIntelligence demo (fixture → interview → publish) | [ARCHITECTURE_INTELLIGENCE_GOLDEN_PATH.md](ARCHITECTURE_INTELLIGENCE_GOLDEN_PATH.md) |
| Choose a **Specialty** buyer-job narrative (after first value or when job is clear) | [`#buyer-jobs-specialty-index`](#buyer-jobs-specialty-index) · buyer-job aliases under [`go-to-market/buyer-jobs/`](../../go-to-market/buyer-jobs/README.md) |
| Static demo proof packet shape (before tenant setup) | [`#buyer-jobs-specialty-index`](#buyer-jobs-specialty-index) · [`#job-accelerator-map`](#job-accelerator-map) |
| Printable evidence checklist before a sponsor demo | [`FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist) |
| Specialty accelerator acceptance criteria | [`ACCELERATOR_ACCEPTANCE_CRITERIA.md`](ACCELERATOR_ACCEPTANCE_CRITERIA.md) |
| Capability inventory and layer model | [`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) |
| Sponsor-facing “why pilot” story | [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) |

---

## Related

- [`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) § Accelerator walkthroughs
- [`CORE_PILOT.md`](../../CORE_PILOT.md) — Core vs Specialty routing
- [`#buyer-jobs-specialty-index`](#buyer-jobs-specialty-index) — outcome-led Specialty pages (`buyer-jobs/README.md` alias)
- [`go-to-market/QUOTE_TO_PROOF_PACKET.md`](../../go-to-market/QUOTE_TO_PROOF_PACKET.md) — proof → quote handoff
