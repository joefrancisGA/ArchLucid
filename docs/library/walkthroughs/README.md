> **Scope:** V1 **Specialty** accelerator template index — buyer-recognizable walkthroughs and outcome-led buyer-job pages. The **Core** first-pilot path is canonical; these templates do not replace it.

# Specialty accelerator templates (V1)

**Audience:** Sales engineers, pilot operators, and sponsors evaluating a **vertical or posture-specific** first review without V1.1 connectors.

**Core spine (start here):** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — the canonical workflow every tenant completes for first value. **Specialty** rows below add a named buyer narrative when the buyer’s job matches; they are **not** mandatory checklists before first commit.

Each Specialty template follows the same shipped sequence — **capture → evidence → policy packs → findings → commit → sponsor export** — and produces a **sponsor artifact** (review package / proof ZIP) at the end.

---

## Specialty catalog

| Template | Buyer question (one line) | Outcome page | Operator walkthrough | Sponsor artifact |
|------|---------------------------|--------------|----------------------|------------------|
| **Azure SaaS readiness** | Does our Azure SaaS posture hold up on WAF and security-baseline themes? | [AZURE_SAAS_READINESS.md](../../go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md) | [AZURE_SAAS_READINESS_REVIEW.md](AZURE_SAAS_READINESS_REVIEW.md) | Architecture review package + committed manifest |
| **AI governance** | Can we show Responsible AI governance on a real review package? | [AI_GOVERNANCE_REVIEW.md](../../go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md) | [AI_GOVERNANCE_REVIEW.md](AI_GOVERNANCE_REVIEW.md) | Responsible AI review export + governance disposition |
| **Healthcare claims (demo)** | How does PHI-minimization policy land on findings before commit? | [HEALTHCARE_CLAIMS_POLICY_REVIEW.md](../../go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md) | [POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) | Policy-backed review package + audit trail |

**Grounding rule:** No Specialty template requires **Jira**, **ServiceNow**, **Confluence**, **Teams**, **Slack**, **MCP**, live commerce, or outbound webhooks for V1 pilot success — see [`INTEGRATION_CATALOG.md`](../../go-to-market/INTEGRATION_CATALOG.md).

---

## When to use which doc

| Need | Read |
|------|------|
| **Core** path from zero to first committed package | [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · [`CORE_PILOT.md`](../../CORE_PILOT.md) |
| Choose a **Specialty** buyer-job narrative (after first value or when job is clear) | Buyer-job pages under [`go-to-market/buyer-jobs/README.md`](../../go-to-market/buyer-jobs/README.md) |
| Printable evidence checklist before a sponsor demo | [`FIRST_RUN_EVIDENCE_CHECKLIST.md`](../../runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md) |
| Capability inventory and layer model | [`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) |
| Sponsor-facing “why pilot” story | [`EXECUTIVE_SPONSOR_BRIEF.md`](../../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) |

---

## Related

- [`PRODUCT_PACKAGING.md`](../PRODUCT_PACKAGING.md) § Accelerator walkthroughs
- [`CORE_PILOT.md`](../../CORE_PILOT.md) — Core vs Specialty routing
- [`go-to-market/buyer-jobs/README.md`](../../go-to-market/buyer-jobs/README.md) — outcome-led Specialty pages
- [`go-to-market/QUOTE_TO_PROOF_PACKET.md`](../../go-to-market/QUOTE_TO_PROOF_PACKET.md) — proof → quote handoff
