> **Scope:** Buyer-job packaging — Responsible AI governance pilot outcome (V1 surfaces only).

# Buyer job — AI governance review

**Classification:** **Specialty** template (optional). Use when the buyer’s job is Responsible AI oversight — not as a mandatory pre-first-value checklist. **Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

**Audience:** Risk, compliance, and architecture leaders who need a **Responsible AI** review package for internal or sponsor audiences.

**Full operator walkthrough:** [`../../library/walkthroughs/AI_GOVERNANCE_REVIEW.md`](../../library/walkthroughs/AI_GOVERNANCE_REVIEW.md)

---

## Buyer question

**“Can we show Responsible AI governance on a real architecture review package — model inventory, oversight themes, and disposition — without implying certification?”**

---

## Target buyer and trigger event

Risk, compliance, architecture, or AI platform sponsors use this accelerator when an internal AI launch needs oversight evidence, an executive asks how model-assisted systems are governed, or a customer diligence review asks for Responsible AI controls.

## Expected first finding types

- Missing model/data lineage, monitoring, or human-review evidence.
- Ambiguous policy ownership for AI-assisted decisions.
- Insufficient safety, prompt-redaction, or evidence-grounding posture for the proposed AI workflow.
- Governance findings that need disposition before a sponsor-ready package is committed.

## Sponsor artifact example

A proof package that states: “This Responsible AI review maps architecture evidence to AI governance findings, disposition status, and a committed manifest.” Include the review package export, finding explanations, and governance gate status.

## ROI and procurement proof points

- Reduced manual governance-review preparation time, clearly labeled as baseline/default/measured.
- Evidence-backed finding explanations and faithfulness/grounding diagnostics where available.
- Procurement-safe distinction between an internal Responsible AI review and formal regulatory certification.

## What not to claim

- Do not claim AI Act, NIST, ISO, HIPAA, or SOC certification.
- Do not imply the model output proves factual truth; it is evidence-supported review assistance.
- Do not require ITSM/chat/MCP connectors for V1 pilot success.

---

## Required inputs

| Input | Notes |
|-------|--------|
| Operator access | **ReadAuthority** / **ExecuteAuthority** |
| AI workload description | ML inference, training boundaries, data-handling narrative in the architecture request |
| Policy pack | **`ai-gov-001`–`ai-gov-020`** in tenant catalog (default seed) |
| Evidence (pilot-dependent) | Extractor ZIP, uploaded diagrams, or registry exports as your pilot allows |

Demo path: Workspace B review `61c60d76-2b80-93f9-46bb-2f66fd608b9b` ([`DEMO_WORKSPACES.md`](../DEMO_WORKSPACES.md)). Synthetic names only — no real PHI.

No ITSM, chat-ops, MCP, or V1.1 connectors required ([`INTEGRATION_CATALOG.md`](../INTEGRATION_CATALOG.md)).

---

## Shipped product steps (V1)

1. **Open or create** the AI governance architecture review (demo review or `/reviews/new`).
2. **Assign** AI Governance / Responsible AI policy pack to project scope; enable pre-commit gate if exercising enforcement.
3. **Execute** pipeline — inspect `ai-gov-*` findings and governance disposition.
4. **Resolve or disposition** blocking items per tenant workflow.
5. **Commit manifest** when the pre-commit gate passes.
6. **Export** sponsor deliverables from review detail (DOCX / ZIP / whitelabel samples when demo seed provides them).

Spine reference: [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

---

## Expected artifacts

- Committed manifest with **ai-gov** finding coverage
- Governance gate status and disposition record on review detail
- Sponsor-readable exports with thematic (not certifying) framework mapping disclaimer
- Executive ROI / summary surfaces with live-data basis labels (no mock production KPIs on live tenant paths)

---

## Evidence generated

- Policy pack evaluation against architecture request and attached evidence
- Finding-level explainability and confidence labels (buyer-facing: Evidence-backed / Model-assisted / Unknown)
- Pre-commit gate audit trail when blocking severities are configured
- Export bundle suitable for architecture review or risk committee readout

---

## Sponsor outcome

A **defensible Responsible AI narrative** anchored in a committed review package — showing oversight themes, findings, and governance status — without claiming regulatory certification. Cross-check claims with [`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md) and [`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md).

---

## How to measure success

Use [`PILOT_SUCCESS_SCORECARD.md`](../PILOT_SUCCESS_SCORECARD.md): `ai-gov-*` findings dispositioned, pre-commit gate status recorded when configured, sponsor export bundle attached, and ROI basis labels explicit (no mock production KPIs on live tenant paths).

---

## Related

| Doc | Use |
|-----|-----|
| [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) | Accelerator pack index |
| [`CORE_PILOT.md`](../../CORE_PILOT.md) | Four-step Core Pilot spine |
| [`PRODUCT_PACKAGING.md`](../../library/PRODUCT_PACKAGING.md) | Capability inventory |
| [`ai-governance-responsible-ai-rules-v1.json`](../../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) | Curated rules corpus sample |
