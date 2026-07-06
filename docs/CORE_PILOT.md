> **Scope:** First architecture review — shortest path from starting a new review to a finalized review package with findings, evidence, and sponsor exports.

# Your first architecture review

Use this guide for the **core first-session workflow** — the canonical path from “new review” to a committed review package. **Specialty review templates** (SaaS readiness, AI governance, healthcare policy) are optional accelerators when your review goal clearly matches that pattern. They are not required before first value.

The step-by-step operator checklist lives in [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md). Evaluators may prefer the compact [`onboarding/EVALUATOR_WORKBOOK.md`](onboarding/EVALUATOR_WORKBOOK.md). For a one-sitting time-boxed path, see [`runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md`](runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md).

**Input:** architecture evidence (brief, diagrams, documents, IaC, exports) or an explicitly accepted demo workspace.  
**Output:** one defensible architecture review package with committed findings, evidence labels, artifacts, and sponsor handoff material.

**Status vocabulary on Home:** **READY / WARN / HOLD / DEFERRED / NEXT ACTION** — see [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md#operator-status-vocabulary).

---

## 1. What to defer until after your first finalized review

Use this guide to prove **create → execute → finalize → review package** once on **your** inputs. Portfolio analysis, deep governance lanes, and specialty accelerators can wait until after the first committed package.

### Optional until after first finalize

| Defer until later | Why |
|-------|-----|
| **Compare, replay, and portfolio graph** at scale | Not required to prove first review value |
| **Advanced policy packs** beyond one optional dry-run | Add when governance is in pilot scope |
| **ITSM and chat connectors** (Jira, ServiceNow, Confluence, Slack, Teams) | Export handoff covers first value; configure connectors when your workflow needs them |
| Reading the full integration catalog before starting | Use [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) instead |

**Stuck?** [`runbooks/FIRST_PILOT_TROUBLESHOOTING.md`](runbooks/FIRST_PILOT_TROUBLESHOOTING.md) (symptom tree) · [`runbooks/PILOT_RESCUE_PLAYBOOK.md`](runbooks/PILOT_RESCUE_PLAYBOOK.md) (quick matrix).

---

## 2. Cloud connectors (Azure, AWS, and GCP)

Cloud connectors are available for **Azure, AWS, and GCP**. Use them when the review needs source-system evidence such as cloud inventory, configuration, identity, policy, cost, or operational signals.

| Need | Doc |
|------|-----|
| Connect Azure, AWS, or GCP securely | **Settings → Cloud connections** (in-product) · [`go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) |
| **Cloud connector intake checklist** (share with security / platform / cloud ops) | [`go-to-market/CLOUD_CONNECTOR_INFOSEC_PREREAD.md`](go-to-market/AZURE_EXTRACTOR_INFOSEC_PREREAD.md) (Azure example) · provider-specific help under **Cloud connections** |
| Upload read-only inventory from your laptop (no long-lived secrets in ArchLucid) | [`runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md`](runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md) |

---

## 3. Depth guides and specialty templates

| Need | Doc |
|------|-----|
| **Single first-session path** (evidence → finalize → export → next action) | [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| **Specialty review templates** (optional buyer-job narratives) | [`library/walkthroughs/README.md`](library/walkthroughs/README.md) |
| Step-by-step UI + “what good looks like” | [`onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md) (**Part 2 — first review**) |
| SaaS readiness — buyer outcome | [`go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md`](go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md) · walkthrough [`library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md`](library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md) |
| AI governance — buyer outcome | [`go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md`](go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md) · walkthrough [`library/walkthroughs/AI_GOVERNANCE_REVIEW.md`](library/walkthroughs/AI_GOVERNANCE_REVIEW.md) |
| Healthcare claims policy — buyer outcome | [`go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md) · walkthrough [`library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) |
| Integration catalog (all connectors and export handoffs) | [`go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) |
| First-session guided checklist in the product | `/onboarding` · see [`library/FIRST_RUN_WIZARD.md`](library/FIRST_RUN_WIZARD.md) |

---

## First session checklist

**In-product:** **Home** shows the guided review workflow (readiness → evidence → create → execute → finalize → sponsor packet). **Docs depth:** four-step narrative below matches [**onboarding/EVALUATION_GUIDE.md**](onboarding/EVALUATION_GUIDE.md) Part 2.

Four steps — canonical sequence for sponsor-facing copy:

### Step-by-step walkthrough

1. **Create** an architecture review. Next: open the new review detail page.
2. **Execute** the review. Next: watch the pipeline timeline until it is ready to finalize.

### Review package and artifacts

3. **Finalize** the review package. Next: confirm the signed review record and artifacts table appear.
4. **Open** exports. Next: download the sponsor packet and collect proof for stakeholders.

**Sponsor-visible artifact:** after finalize, use review detail (**“Email this review to your sponsor”** when available) plus **[`go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** for narrative context.

Keep buyer-facing copy centered on the **architecture review package**. Support tickets may reference the review identifier shown in the product.

---

## Evidence-only review path

Use this path when **connector access has not yet been approved**, or when the first session only has briefs, diagrams, IaC, screenshots, exports, or policy documents.

| Step | Action |
|------|--------|
| 1 | Start a review with **No cloud / evidence-only** as the cloud target. |
| 2 | Upload evidence files or paste the architecture brief — a cloud connector is **not** required. |
| 3 | Execute → finalize → export the sponsor packet. |

**When to add a cloud connector later:** live cloud inventory, cost lines, or configuration-backed findings. Share the **cloud connector intake checklist** with your security team before enabling read-only connector access — see [Cloud connectors](#2-cloud-connectors-azure-aws-and-gcp).
