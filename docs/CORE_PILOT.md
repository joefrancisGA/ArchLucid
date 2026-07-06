> **Scope:** First architecture review — shortest path from starting a new review to a finalized review package with findings, evidence, and sponsor exports.

# Your first architecture review

Use this guide with the [Pilot guide](/help/pilot-guide) to prepare for a pilot, interpret outputs, and get support contacts.

This page focuses on the **core first-session workflow** — from “new review” to a committed review package. **Specialty review templates** (SaaS readiness, AI governance, healthcare policy) are optional accelerators when your review goal clearly matches that pattern.

**Input:** architecture evidence (brief, diagrams, documents, IaC, exports) or an explicitly accepted sample workspace.  
**Output:** one defensible architecture review package with committed findings, evidence labels, artifacts, and sponsor handoff material.

> **Status on Home:** **READY / WARN / HOLD / DEFERRED / NEXT ACTION** label the next best action on your workspace dashboard.

## Run the first review

**In-product:** **Home** shows the guided review workflow (readiness → evidence → create → execute → finalize → sponsor packet).

**Four steps — sponsor-facing sequence:**

1. **Create** an architecture review. Next: open the new review detail page.
2. **Execute** the review. Next: watch progress until the review is ready to finalize.
3. **Finalize** the review package. Next: confirm the signed review record and artifacts table appear.
4. **Open exports** — download the sponsor packet and collect proof for stakeholders.

**Good to know:** After finalize, use **Email this review to your sponsor** on review detail when sponsor handoff is enabled.

## Cloud connectors (Azure, AWS, and GCP)

Cloud connectors are available for **Azure, AWS, and GCP**. Use them when the review needs source-system evidence such as cloud inventory, configuration, identity, policy, cost, or operational signals.

| Need | Where to go |
|------|-------------|
| Connect a cloud provider | **Settings → Cloud connections** · [Cloud connections](/help/cloud-connections) |
| Security intake checklist | Share with InfoSec before enabling connectors — see [Cloud connections](/help/cloud-connections) |
| Laptop-side inventory upload | [Start a review](/help/evidence-intake) |

## Evidence-only review path

Use this path when **connector access has not yet been approved**, or when the first session only has briefs, diagrams, IaC, screenshots, exports, or policy documents.

| Step | Action |
|------|--------|
| 1 | Start a review with **No cloud / evidence-only** as the cloud target. |
| 2 | Upload evidence files or paste the architecture brief — a cloud connector is **not** required. |
| 3 | Execute → finalize → export the sponsor packet. |

**When to add a cloud connector later:** live cloud inventory, cost lines, or configuration-backed findings. Share the cloud connector intake checklist with your security team before enabling read-only connector access.

## Optional until after your first finalized review

| Defer until later | Why |
|-------------------|-----|
| **Compare, replay, and portfolio graph** at scale | Not required to prove first review value |
| **Advanced policy packs** beyond one optional dry-run | Add when governance is in pilot scope |
| **ITSM and chat connectors** (Jira, ServiceNow, Confluence, Slack, Teams) | Export handoff covers first value; configure connectors when your workflow needs them |

**Stuck?** [Troubleshooting](/help/troubleshooting) · [Pilot guide — Report an issue](/help/pilot-guide#report-an-issue)

<details>
<summary>Additional depth guides and specialty templates</summary>

| Need | Doc |
|------|-----|
| **Single first-session path** (evidence → finalize → export) | [Complete review workflow](/help/first-pilot-path) |
| **Specialty review templates** | [Specialty walkthroughs](/help/specialty-walkthroughs) |
| Step-by-step UI + “what good looks like” | [Evaluator workbook](/help/evaluator-workbook) |
| SaaS readiness | [Specialty walkthroughs](/help/specialty-walkthroughs) |
| AI governance | [Specialty walkthroughs](/help/specialty-walkthroughs) |
| Healthcare claims policy | [Specialty walkthroughs](/help/specialty-walkthroughs) |
| First-session checklist in the product | **Onboarding** in the workspace |

</details>
