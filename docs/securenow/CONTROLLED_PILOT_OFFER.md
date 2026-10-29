> **Scope:** Internal proposal for a SecureNow controlled pilot. Not an approved customer offer. Beta remains NO_GO until the owner checklist is cleared.

# SecureNow — controlled enterprise pilot offer and acceptance plan

> **INTERNAL PROPOSAL / NOT AN APPROVED CUSTOMER OFFER.** Buyer-adaptable commercial planning document, not a release certification, binding quote, deployed capability attestation, or claim of customer results. A synthetic demo is **NOT customer evidence**. SecureNow beta release remains **NO_GO** until all owner-approved staging, identity, security and release gates are completed. Pricing, dates, legal terms, security assurances and scope require human approval.

## The offer in one minute

**For whom:** Azure cloud-security, infrastructure, and security-architecture teams that must explain which *possible* access paths matter, what evidence supports them, and whether a separately approved intervention changed the observed condition.

**Problem:** Alert and misconfiguration lists do not always tell a decision owner which permission/reachability combinations deserve attention, what to change, or whether later evidence supports closure.

**Proposed bounded evaluation:** In one mutually agreed Azure environment, use tenant-authorized Reader-only inventory and approved optional companion evidence to produce inspectable, provenance-labeled paths and prioritized advisory cut points. The customer's engineer performs any change **outside SecureNow** and supplies the change attestation; a later successful capture and completed analysis are required before reporting verification. Partial or missing collection remains visible as an evidence gap.

**Possible buyer decision after the pilot:** Continue evaluating, stop, or discuss a separately approved paid engagement. No paid conversion, ROI, remediation success, or compliance claim is assumed.

## Qualification and suitability

A potential design partner should have: (1) an accountable Azure security/architecture sponsor and technical operator; (2) written authority to provide selected Azure subscription inventory or an approved redacted export; (3) a defined tenant/workspace/project and clearly bounded subscription scope; (4) a use case involving privileged access, reachability, or evidence-backed security decisions; (5) an approved channel for discussing security findings; and (6) capacity to participate in a baseline/verification review.

**Do not begin** if there is no collection authorization, no tenant-isolation acceptance, a dependency on autonomous ARM/Terraform writes, an expectation of exploit confirmation or SOC 2 certification, no approved handling for confidential resource identifiers, or an unsupported non-Azure requirement. A request for guaranteed breach prevention, numeric likelihood, or assured savings is not an acceptable success criterion.

## Proposed engagement sequence — milestones, not promised dates

| Stage | Buyer and SecureNow responsibilities | Required exit evidence |
| --- | --- | --- |
| 0. Sponsor and scope agreement | Name sponsor, operator, technical reviewer; approve subscriptions, tenant, data sensitivity, purpose, retention and support | Authorized written pilot scope; named escalation contact |
| 1. Security and release gate | Internal owner verifies all 22 beta matrix rows, live authentication and foreign-tenant denial, protected staging, recovery and incident/support path | Recorded candidate SHA and owner go/no-go; otherwise **NO_GO** |
| 2. Baseline | Authorized Reader-only Azure capture or approved upload; disclose partial/missing sources | Capture ID, timestamps, completeness, scope and permission proof |
| 3. Decision review | Inspect selected path IDs, source hops, uncertainty bands, ranked dimensions and advisory cut point | Signed-off shortlist with rejected/unknown conclusions preserved |
| 4. Optional external change | Customer's authorized engineer decides and implements changes in their own workflow | Separate change record and human attestation; no in-product auto-apply |
| 5. Verification | Repeat authorized capture; compare substantive postconditions, chronology and analysis completion | Verified / not verified / insufficient evidence explicitly distinguished |
| 6. Sponsor readout | Review benefits, limitations, operator feedback, security issues and disposition | Reviewed evidence packet with owner decision, objections and follow-ups |

Stages 4–5 are conditional on customer approvals and useful candidates. **A pilot can succeed in demonstrating investigative clarity without claiming that a remediation was performed or verified.**

## Measurable acceptance criteria

Agree baselines and minimum sample sizes **before** collecting outcome data. Do not treat demonstration fixture results as observations.

| Criterion | Evidence and calculation | Decision rule |
| --- | --- | --- |
| Provenance | Share of pilot-selected paths with source capture, cited hops, scope and epistemic labels | Must be reviewable; unresolved provenance is an explicit gap |
| Collection completeness | Accessible/expected scoped resources and missing companion evidence | Report denominator, exclusions and partial captures; no false clean status |
| Decision usefulness | Buyer reviewers can explain why selected paths outrank alternatives and where to intervene | Sponsor records useful/not useful and specific objections |
| Tenant isolation | Live negative tests for foreign tenant, workspace and project on candidate release | **Blocking**: no unauthorized cross-scope read or write |
| Remediation honesty | External human change attestation separated from advisory recommendation | No auto-change claim, no unverified closure |
| Verification correctness | Later successful snapshot, chronological ordering, completed analysis, substantive postcondition | Missing element => **NOT VERIFIED** or insufficient evidence |
| Investigation effort | Comparable baseline vs pilot investigation tasks, analyst minutes and denominators | Report observed change and uncertainty; no invented ROI |
| Reliability and recovery | Collection failures, support incidents, export usability, staging rollback | Blocking operational defects escalated; recovery must be demonstrated for release |
| Security and customer trust | Privacy/retention approval, redacted artifacts, named support owner | Buyer and release owner explicitly review unresolved items |

**Pilot outcome:** *Proceed to commercial discussion*, *extend with bounded remediation*, or *stop*. The sponsor and product owner decide; engineering checks do not automatically confer commercial approval. Do not preassign numeric performance, savings, detection-accuracy or conversion thresholds without a documented baseline and sponsor-approved criterion.

## Proposed commercial terms — intentionally unpriced

- **Pilot model:** controlled, limited-scope design-partner evaluation; exact duration, participant count, supported subscriptions, environments, hosting, and data processing are **TO BE NEGOTIATED**. Fee amounts the owner has approved for a private quote live only in [PRIVATE_PRICE_SHEET.md](PRIVATE_PRICE_SHEET.md). That sheet is not itself a customer offer. Founder response targets for support hours are recorded in [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md). Those targets are not a contractual SLA, not service credits, and not approval of buyer communication.
- **Customer commitments:** authorized access/export, technical reviewers, timely clarifications, change-control ownership, and feedback/readout participation.
- **Vendor commitments to negotiate:** tenant-scoped access, an explicit data-handling agreement, supported evaluation workflow, escalation route, documented limitations, and orderly exit/export/deletion policy subject to sealed-evidence exceptions.
- **Paid expansion triggers:** mutually accepted scope and security review, evidence of decision usefulness, a supportable operational plan, confirmed procurement requirements, and individually approved pricing. Do not claim an existing paid customer or market price.
- **No blanket warranty:** no autonomous remediation, exploit observation, breach avoidance, regulatory certification, non-Azure coverage, or guaranteed ROI.

## Buyer objections — response discipline

| Question | Evidence-based response |
| --- | --- |
| “Why not use Defender, CSPM, or a scanner?” | Position SecureNow as an **evaluation of evidence-linked path prioritization and verification clarity**, not a proven replacement. Run side-by-side comparisons only when the buyer authorizes them. |
| “Will it fix my Azure environment?” | **No automatic apply.** It can recommend advisory cut points; the customer owns external change and approval. |
| “Does a path prove an attacker used it?” | No. Separate observed configuration, deterministic inference, AI inference and human assertion. |
| “Is it compliant / SOC 2 certified?” | Do not imply certification or an independent pen test without reviewed documents. |
| “How much will it save?” | No unmeasured saving. Use comparable analyst hours, scope, sample and actual operating cost; distinguish capacity from cash. |
| “Can I use it now?” | The controlled beta is not approved until the release owner clears the documented offline and live gates. |

## Owner-controlled release and sales checklist

- [ ] Pilot sponsor, technical operator, deployment owner and support contact named
- [ ] Customer consent, allowed subscriptions, least-privilege, data handling, retention and exit agreed
- [ ] Candidate release SHA, 22-row evidence matrix and required CI results reviewed
- [ ] Live staging operator login, foreign-tenant negative tests and rollback evidence approved
- [ ] Real Azure Reader collection succeeds with all gaps and limitations visible
- [ ] Cited path, decision, external change ownership and verification claims demonstrated honestly
- [ ] Executive proof packet populated with actual evidence and human reviewed; synthetic claims removed
- [ ] Pricing, contract, security statements, support commitment and buyer communication approved
- [ ] If any blocking gate is open: mark **NO_GO** and use demo-only materials without customer-performance claims

## Existing sources and handoffs

- [Buyer demonstration script](BUYER_PROOF_DEMO.md)
- [Executive evidence packet template](EXECUTIVE_PROOF_PACKET_TEMPLATE.md)
- [22-requirement beta evidence gate](BETA_EVIDENCE_GATE.md)
- [Non-deploying beta smoke and staging prerequisites](BETA_DEPLOYMENT_SMOKE.md)
- [SecureNow product requirements and explicit holds](SECURENOW_REQUIREMENTS.md)
- [Private quote sheet](PRIVATE_PRICE_SHEET.md) — owner-approved fees only; not a customer offer
- [Support commitment](SUPPORT_COMMITMENT.md) — founder acknowledgement targets; not a contractual SLA and not buyer-communication approval

**Document status:** Prepared for commercial-owner review. Not an approved offer or evidence of a live customer pilot.
