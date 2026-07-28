> **Scope:** One-page evaluator decision guide — choose a first proof path without reading every runbook.

# First evaluator decision — what to do first

**Audience:** Buyer evaluators, pilot operators, and founders orienting a first ArchLucid proof.

**Last reviewed:** 2026-06-13

Answer three questions before you start:

1. What path am I on?
2. What will I get?
3. When must I stop?

This page has **three choices only**. Detailed procedures stay in linked runbooks — do not treat this as a second operational checklist.

---

## Choice A — Demo walkthrough (no Azure credentials)

| | |
| --- | --- |
| **Inputs** | Web browser only; optional seeded demo workspace |
| **Path** | [`CORE_PILOT.md`](../CORE_PILOT.md) narrative → marketing demo or operator demo workspace |
| **Expected artifact** | Walkthrough of review create → execute → commit; static demo proof shape in [`walkthroughs/README.md#buyer-jobs-specialty-index`](../library/walkthroughs/README.md#buyer-jobs-specialty-index) (`buyer-jobs/README.md` alias) |
| **Stop when** | You need sponsor-safe real-mode wording, production-like auth, or procurement evidence — switch to Choice B or C |

**Not required for this path:** SQL install, Azure extractor upload, real Azure OpenAI, SOC 2 CPA, third-party pen test, live Marketplace checkout, V1.1 ITSM/chat connectors.

---

## Choice B — Real Azure extractor pilot (technical evaluator)

| | |
| --- | --- |
| **Inputs** | Azure Resource Graph export or accepted sample; API + SQL per [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) |
| **Path** | Operator checklist Phase A–C: create review → execute → **commit** |
| **Expected artifact** | Committed manifest, review detail with execution mode label, optional `archlucid pilot proof-packet <runId>` folder |
| **Stop when** | PilotStrict not satisfied, execution mode is Simulator/Fallback/Mixed without caveats accepted, or demo tenant — do **not** send sponsor packet |

**Time box:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed)

**Recovery:** [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md)

---

## Choice C — Production-like sponsor handoff (founder / sales engineer)

| | |
| --- | --- |
| **Inputs** | Staging or hosted pilot with OIDC/API key; committed `runId`; production-like profile |
| **Path** | [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md) → `collect-first-pilot-proof.ps1 -RunId … -SponsorHandoff -FailOnHold -ProductionLikeHostedPilot` |
| **Expected artifact** | Proof folder with `first-pilot-command-center.md`, `go-no-go-summary.json`, timing budget, AI readiness gate — disposition **SEND**, **HOLD**, or **DEFERRED_SCOPE** only |
| **Stop when** | Any gate is HOLD, redaction fails, execution mode is not honestly labeled, or ROI is not sponsor-safe — fix before external send |

**Evidence bundle:** [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)

**Commercial conversion:** [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist)

---

## Explicitly not first-pilot requirements (V1)

These are **deferred** or **(B) procurement realism** — label them if a buyer asks, but do not block Choice A–C:

| Topic | V1 posture |
| --- | --- |
| SOC 2 CPA attestation | Deferred — self-assessment only ([`trust-center.md`](../go-to-market/trust-center.md)) |
| Third-party penetration test | Deferred / planned |
| Live Marketplace / Stripe self-serve | Deferred — sales-led order form |
| First-party Jira, ServiceNow, Confluence, Slack, Teams | **V1.1** ([`V1_DEFERRED.md`](../library/V1_DEFERRED.md)) |
| MCP / broad connector catalog | **V1.1+** |

---

## Depth links (after you pick a choice)

| Need | Doc |
| --- | --- |
| Canonical operator checklist | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) |
| Buyer one screen | [`BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) |
| Why not generic AI | [`DIFFERENTIATION_PROOF_PACKET.md`](../go-to-market/DIFFERENTIATION_PROOF_PACKET.md) |
| Hub entry | [`START_HERE.md`](../START_HERE.md) |
