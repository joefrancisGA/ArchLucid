> **Scope:** One-page procurement evidence packet for V1 buyer diligence. This is a concise routing artifact, not a new assurance claim, certification, or product promise.

# Procurement evidence packet

**Audience:** Procurement reviewers, security reviewers, GRC teams, architecture sponsors, and enterprise buyers who need to understand what ArchLucid V1 proves, which evidence exists, and which items are explicitly deferred.

**Use this when:** A buyer asks, "What can I give my CIO, security team, architecture review board, or procurement committee so they can evaluate ArchLucid without reading the whole repository?"

**Buyer-safe rule:** This packet only points to existing evidence. It does **not** claim SOC 2 Type II, a third-party penetration test, a published public reference customer, live Stripe production transactability, or a published Marketplace offer unless a linked source explicitly says that status has changed.

---

## 1. One-page buyer summary

ArchLucid is an AI-assisted architecture workflow system that shortens the path from an architecture request to a reviewable, defensible architecture package. V1 is best understood as a **sales-led pilot product** for regulated enterprise architecture teams: it helps teams produce a committed manifest, findings, reviewable deliverables, evidence trail, governance context, and audit history for human review.

The V1 proof is not "autonomous architecture." The V1 proof is narrower and more credible:

- A team can move from a structured architecture request to a finalized review package.
- The package contains a manifest, findings, evidence references, and deliverables suitable for sponsor or architecture-board review.
- Governance, audit, and traceability surfaces make the review easier to defend than an ad hoc document assembled after the fact.
- AI-generated narrative is decision support, while persisted manifests, findings, traces, approvals, and audit events remain the reviewable evidence.

---

## 2. What V1 proves

| Buyer question | V1 evidence to review |
|---|---|
| What does the product do? | [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md) |
| What is the first pilot path? | [Core Pilot path](../CORE_PILOT.md) |
| What is the architecture at a glance? | [Architecture on one page](../ARCHITECTURE_ON_ONE_PAGE.md) |
| What is in V1 and what is out of scope? | [V1 Scope](../library/V1_SCOPE.md) and [V1 Deferred](../library/V1_DEFERRED.md) |
| What should a pilot measure? | [Pilot Success Scorecard](PILOT_SUCCESS_SCORECARD.md) and [ROI Model](ROI_MODEL.md) |
| What is the security/procurement index? | [Trust Center](trust-center.md) and [Procurement Pack Index](PROCUREMENT_PACK_INDEX.md) |
| How do questionnaire answers map to evidence? | [Procurement Response Accelerator](PROCUREMENT_RESPONSE_ACCELERATOR.md) |

---

## 3. Procurement reviewer checklist

A reviewer should be able to answer these questions from the linked packet before escalation to legal, security, or procurement leadership.

| Area | What to verify | Primary evidence |
|---|---|---|
| Product purpose | The product creates reviewable architecture packages, not legal attestations or autonomous infrastructure changes. | [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md) |
| Pilot success | The pilot has measurable success criteria, not just a demo narrative. | [Pilot Success Scorecard](PILOT_SUCCESS_SCORECARD.md), [ROI Model](ROI_MODEL.md) |
| Architecture | The platform boundary, data stores, UI/API/worker shape, and external dependencies are documented. | [Architecture on one page](../ARCHITECTURE_ON_ONE_PAGE.md) |
| Security posture | Authentication, tenant isolation, data handling, trust-center material, and known assurance status are documented. | [Trust Center](trust-center.md), [Security Overview](../library/SECURITY.md), [Tenant Isolation](TENANT_ISOLATION.md) |
| Auditability | The product has an audit-event posture and evidence-trail model suitable for human review. | [Audit Coverage Matrix](../library/AUDIT_COVERAGE_MATRIX.md), [Trust Center](trust-center.md) |
| Governance | V1 includes governance workflows and approval concepts, while deeper maturity surfaces remain controlled by scope. | [V1 Scope](../library/V1_SCOPE.md), [Core Pilot path](../CORE_PILOT.md) |
| Compliance posture | The product is honest about self-assessed, deferred, template, and external/NDA-gated artifacts. | [Procurement Pack Index](PROCUREMENT_PACK_INDEX.md), [Procurement Response Accelerator](PROCUREMENT_RESPONSE_ACCELERATOR.md) |
| Deferred scope | V1.1/V2 items are explicitly named and should not be treated as hidden V1 promises. | [V1 Deferred](../library/V1_DEFERRED.md) |

---

## 4. Evidence map by stakeholder

### CIO / CTO / executive sponsor

Start with:

- [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md)
- [Core Pilot path](../CORE_PILOT.md)
- [Pilot Success Scorecard](PILOT_SUCCESS_SCORECARD.md)
- [ROI Model](ROI_MODEL.md)

Decision focus:

- Does the product shorten architecture review cycle time?
- Does it create a package that can be defended in review?
- Does the pilot produce enough evidence to justify broader selected use?

### Architecture review board / chief architect

Start with:

- [Architecture on one page](../ARCHITECTURE_ON_ONE_PAGE.md)
- [V1 Scope](../library/V1_SCOPE.md)
- [Core Pilot path](../CORE_PILOT.md)
- [Architecture Request Wire Format](../library/ARCHITECTURE_REQUEST_WIRE_FORMAT.md)

Decision focus:

- Does the review package contain useful findings, decisions, and evidence?
- Does the manifest model fit the organization’s architecture governance process?
- Are graph, audit, and governance surfaces useful as follow-on maturity paths?

### Security / GRC / procurement

Start with:

- [Trust Center](trust-center.md)
- [Procurement Pack Index](PROCUREMENT_PACK_INDEX.md)
- [Procurement Response Accelerator](PROCUREMENT_RESPONSE_ACCELERATOR.md)
- [SOC 2 Procurement Status](SOC2_STATUS_PROCUREMENT.md)
- [DPA Template](DPA_TEMPLATE.md)
- [Subprocessors](SUBPROCESSORS.md)

Decision focus:

- Which controls are implemented, self-attested, template-based, deferred, or NDA-gated?
- Which assurance artifacts exist now?
- Which claims are intentionally not made?

### Pilot owner / sales engineer

Start with:

- [Core Pilot path](../CORE_PILOT.md)
- [Pilot Success Scorecard](PILOT_SUCCESS_SCORECARD.md)
- [Buyer-safe Evidence Template](PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md)
- [Second Run guide](../library/SECOND_RUN.md)

Decision focus:

- What is the first-session success path?
- What data should be collected before and after the pilot?
- How is ROI framed without inventing customer evidence?

---

## 5. Explicit non-claims and deferred items

These items are intentionally **not** claimed as completed V1 procurement evidence unless the linked source later changes that status.

| Item | Current packet posture | Evidence / source of truth |
|---|---|---|
| SOC 2 Type II CPA-issued report | Not claimed as issued. Current posture is self-assessment plus roadmap. | [SOC 2 Procurement Status](SOC2_STATUS_PROCUREMENT.md), [SOC 2 Self-Assessment](../security/SOC2_SELF_ASSESSMENT_2026.md), [V1 Deferred](../library/V1_DEFERRED.md) |
| Third-party penetration test summary | Not available today. Vendor-led testing is planned, not yet scheduled. | [V1 Deferred](../library/V1_DEFERRED.md), [Pen-test SoW Template](../security/pen-test-summaries/2026-Q2-SOW.md) |
| Public named reference customer | Not required for V1 readiness. V1.1 commercial milestone if/when owner/customer conditions are met. | [V1 Deferred](../library/V1_DEFERRED.md) |
| Published Marketplace / live Stripe transactability | Not required for V1 readiness. Sales-led pilots and templates are the V1 commercial path. | [V1 Deferred](../library/V1_DEFERRED.md) |
| PGP key for coordinated disclosure | V1.1 candidate, not V1 evidence. | [V1 Deferred](../library/V1_DEFERRED.md), [PGP Key Generation Recipe](../security/PGP_KEY_GENERATION_RECIPE.md) |
| MCP server / third-party plugin marketplace | Not V1. MCP is V1.1-scoped; broader plugin marketplace is later unless promoted. | [V1 Deferred](../library/V1_DEFERRED.md), [MCP and Agent Ecosystem Backlog](../library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) |

---

## 6. Pilot packet contents

For a sales-led V1 pilot, the buyer-facing packet should include:

1. [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md)
2. [Architecture on one page](../ARCHITECTURE_ON_ONE_PAGE.md)
3. [Core Pilot path](../CORE_PILOT.md)
4. [Pilot Success Scorecard](PILOT_SUCCESS_SCORECARD.md)
5. [ROI Model](ROI_MODEL.md)
6. [Trust Center](trust-center.md)
7. [Procurement Pack Index](PROCUREMENT_PACK_INDEX.md)
8. [Procurement Response Accelerator](PROCUREMENT_RESPONSE_ACCELERATOR.md)
9. [V1 Scope](../library/V1_SCOPE.md)
10. [V1 Deferred](../library/V1_DEFERRED.md)

Optional, depending on buyer diligence:

- [DPA Template](DPA_TEMPLATE.md)
- [Subprocessors](SUBPROCESSORS.md)
- [SOC 2 Procurement Status](SOC2_STATUS_PROCUREMENT.md)
- [CAIQ Lite pre-fill](../security/CAIQ_LITE_2026.md)
- [SIG Core pre-fill](../security/SIG_CORE_2026.md)
- [Audit Coverage Matrix](../library/AUDIT_COVERAGE_MATRIX.md)
- [Tenant Isolation](TENANT_ISOLATION.md)
- [Healthcare Vertical Brief](HEALTHCARE_VERTICAL_BRIEF.md)

---

## 7. Recommended buyer-facing answer

Use this answer when a buyer asks for a procurement-ready summary:

> ArchLucid V1 is ready for a sales-led regulated-enterprise pilot where the goal is to prove faster architecture review package creation, stronger evidence traceability, and clearer governance/audit handoff. The current packet includes a sponsor brief, architecture overview, pilot success scorecard, ROI model, trust center, procurement artifact index, questionnaire accelerator, V1 scope, and explicit deferral register. It does not claim issued SOC 2 Type II, a completed third-party penetration test, a public reference customer, live Marketplace transactability, or live Stripe production status unless those source documents are later updated.

---

## 8. Maintenance rules

- Keep this file aligned with [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md); do not create a second buyer story.
- Keep assurance and deferral language aligned with [V1 Scope](../library/V1_SCOPE.md), [V1 Deferred](../library/V1_DEFERRED.md), and [Trust Center](trust-center.md).
- Do not add new certifications, attestations, external customer claims, or legal promises here.
- If a linked source changes status, update this packet in the same PR or cite why no packet update is required.
- Prefer concise routing and buyer language over a long documentation index.
