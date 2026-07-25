> **Reviewed:** 2026-07-25

> **Scope:** Sequencing map — assemble one executive paid-pilot proof packet from a committed run, then rehearse it in a mock procurement review. This is an **index/runbook only**; it restates no policy, ROI math, or assurance claim. Canonical sources own those. Market-validation tooling (V1 design half); running it on real authorized data is GTM backlog **M-37 (V1.1)**.

# Executive paid-pilot proof packet (assembly + mock procurement review)

**Audience:** Founder / pilot operator / sales engineer preparing a **paid** executive sponsor packet and rehearsing it before a real procurement call.  
**Last reviewed:** 2026-07-25

**Goal:** Turn one finalized review into the six-element executive proof packet the buyer's sponsor + procurement reviewers actually need, then pressure-test it in a mock procurement review **before** sending.
**Execution tracked as:** GTM backlog **M-37 (V1.1)**. This document is the reusable **design half** (the assembly + mock-review sequence); assembling a *real* authorized packet and running a *real* mock procurement review require a committed run and human reviewers a coding agent cannot supply.

This implements assessment Improvement **#4**. It deliberately **reuses** the existing assembly CLI, send gates, evidence templates, mock-procurement drill, and paid-pilot ledger — it does not duplicate them. Every row links to the canonical owner.

---

## Six required elements → where each comes from (reuse, do not re-author)

The executive paid-pilot proof packet is **not** a new document set. It is the existing sponsor-packet output plus **one remediation ticket**, assembled and labeled for an executive buyer.

| # | Required element | Canonical source / command | Claim boundary |
| --- | --- | --- | --- |
| 1 | **ROI assumptions** | `executive-summary.json` (`GET /v1/roi/executive-summary`) + [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) + [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Lead with dollars only when `roiSponsorSafe=true`; otherwise lead with decision/remediation basis |
| 2 | **Freshness labels** | `go-no-go-summary.json` → `roiBasisStatus`, cost-evidence freshness; [`ROI_BASELINE_SEND_POLICY.md`](ROI_BASELINE_SEND_POLICY.md) | Demo-derived/illustrative values must not read as buyer outcomes |
| 3 | **Cited evidence** | `provenance-references.json` (audit + artifact ids) + [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) | Evidence-linked claims only; no benchmark superiority without data |
| 4 | **Disposition basis** | `go-no-go-summary.json` → `sponsorPacketDisposition` (`SEND`/`HOLD`/`DEFERRED_SCOPE`); disposition-aware ROI headline | Use the field verbatim; do not upgrade `HOLD`/`WARN` |
| 5 | **Audit timeline** | `provenance-references.json` + [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) | Append-only audit rows; ids only, no payloads or PII |
| 6 | **One remediation ticket** | ITSM outbound create (`POST /v1/integrations/itsm/outbound/issues`) → durable `ItsmFindingCorrelations` reference; see § Remediation-ticket step | Include the **correlation reference only**; never paste ticket bodies with customer identifiers |

Elements 1–5 are emitted by `archlucid sponsor-packet` / `collect-first-pilot-proof.ps1 -SponsorHandoff` (see [`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md)). **Element 6 is the one piece the assembly does not auto-produce** — it is an explicit operator step below.

---

## Step 1 — Assemble (reuse existing CLI)

Use the committed run. Do not hand-edit findings or ROI to make the packet look better — that breaks the proof-packet run log discipline.

```powershell
.\scripts\collect-first-pilot-proof.ps1 -RunId '<committed-run-guid>' -SponsorHandoff -FailOnHold
```

Stop if exit code ≠ 0 or `go-no-go-summary.json` disposition = `HOLD`. The assembled folder gives elements **1–5**. Layout reference: [`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md) § Packet layout.

## Step 2 — Remediation-ticket step (element 6)

The executive story is incomplete without showing the review **handed off to a system of record**, not just a PDF. Create **one** ITSM ticket from a committed finding and include its correlation reference in the packet.

| Action | Detail |
| --- | --- |
| Create one ticket | `POST /v1/integrations/itsm/outbound/issues` for one committed `FindingId` (Jira or ServiceNow per the pilot's system of record) |
| Capture reference | Record the persisted `ItsmFindingCorrelations` id / external key — **reference only**, not the ticket body |
| If ITSM not configured | Use the copy/export fallback and label element 6 **`fallback-export`** (do not imply native create ran) |

Prerequisite check before this step: confirm ITSM is enabled for the tenant (native create is configuration-gated). See [`../library/CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md).

## Step 3 — Pre-send gate (reuse existing checklist)

Run the existing send gate before any external circulation — do not re-invent it:

- [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md#operating-checklist) — pre-send gates (execution mode, ROI basis, disposition, no manual surgery, redaction)
- [`SPONSOR_PACKET_SEND_NO_SEND_HARDENING_REVIEW.md`](SPONSOR_PACKET_SEND_NO_SEND_HARDENING_REVIEW.md)

All six elements present + send gate PASS → proceed to the mock review. Any HOLD → fix the underlying run, do not paper over it.

## Step 4 — Mock procurement review (rehearse before the real call)

This is the "use it in a mock procurement review" half of #4. Reuse the existing drill — do not author a new objection set:

1. Hand the assembled packet to an internal reviewer playing procurement/security.
2. Run the [controlled pilot drill](PROCUREMENT_OBJECTION_PLAYBOOK.md#controlled-pilot-drill) (45–60 min) using [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md) answers, focused on objections **#1 (SOC 2)**, **#2 (pen test)**, **#8 (pack completeness)**, and real-mode AI evidence boundaries.
3. Walk the six elements against the [evidence routing map](BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-routing-map).
4. Record every objection the packet could **not** answer from existing evidence.

---

## PASS / HOLD (mock review outcome)

| Outcome | Criteria |
| --- | --- |
| **PASS** | All six elements present and labeled; send gate PASS; mock reviewer reaches a sponsor decision (approve / approve-with-conditions) using only packet evidence; deferred items (`(B)` SOC 2 CPA, pen test, reference customer) accepted as scope, not defects |
| **HOLD** | A required element is missing/unlabeled, send gate HOLD, or an objection cannot be answered from existing evidence without a new claim |

On HOLD, do **not** invent a claim — either fix the run/labels or route the gap honestly (deferred scope vs real product gap).

---

## Remainder → GTM V1.1 backlog (`M-37`)

The **market-execution half** is moved to the GTM V1.1 backlog and cannot be performed by a coding agent:

- Assembling a packet from a **real or sanitized authorized** committed run (real ROI baselines, buyer evidence).
- Running the mock procurement review with **real human reviewers**, then a **real** procurement call.
- Filing the outcome in [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md) (tracked **M-37**).

This document (the assembly + mock-review sequence) is the V1 design half; no V1 engineering or `(A)` headline action remains for #4.

---

## Related (canonical owners — do not duplicate)

| Asset | Role |
| --- | --- |
| [`../runbooks/SPONSOR_PACKET.md`](../runbooks/SPONSOR_PACKET.md) | One-command packet assembly (elements 1–5) |
| [`QUOTE_TO_PROOF_PACKET.md`](QUOTE_TO_PROOF_PACKET.md) | Proof → quote/annual-order index |
| [`templates/evidence-packet-buyer.template.md`](templates/evidence-packet-buyer.template.md) | Buyer/executive evidence template + claim boundaries |
| [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md#operating-checklist) | Pre-send gate + G4 discipline |
| [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md) (incl. controlled pilot drill) | Mock procurement review |
| [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md) | Procurement reviewer checklist and evidence routing |
| [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md) | Real paid-pilot outcome capture (**M-37**) |
| [`demo-proof-packets/README.md`](demo-proof-packets/README.md) | Worked buyer-safe exemplars |
