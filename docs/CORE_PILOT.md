> **Scope:** Core Pilot spine — shortest path from “new review” to committed manifest + review package; defers playbook depth to the evaluation guide and operator quickstart.
> **Hub:** [`START_HERE.md`](START_HERE.md).

# Core Pilot

Use this page when you need the **four-step Core Pilot** narrative without scrolling the full evaluator guide. **Buyer / hosted path** (no install) stays in **Part 1** of [**onboarding/EVALUATION_GUIDE.md**](onboarding/EVALUATION_GUIDE.md); Core Pilot specifics are expanded in **Part 2** of that guide.

---

## 1. What stays secondary (scope boundary)

Do not mistake the Core Pilot checklist for full product scope — advanced Operate lanes, entitlement-specific depth, and GA-gated paths live under **[`library/V1_SCOPE.md`](library/V1_SCOPE.md)** and linked runbooks. Use Core Pilot to prove **request → execute → commit → review package** once on **your** inputs.

### Ignore for first pilot (defer until after first commit)

| Defer | Why |
|-------|-----|
| **Operate** compare, replay, graph-at-scale, governance dashboards | Not required to prove first architecture review value |
| **V1.1 connectors** (Jira, ServiceNow, Confluence, Slack, Teams) | See [`go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) |
| Advanced policy packs beyond one optional dry-run | Add only when governance is in pilot scope |
| MCP, live commerce, hosted Tier 2 extractor WIF | Out of V1 first-hour path |
| Reading full **V1 scope** or integration catalog before starting | Use [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) instead |

**Stuck?** [`runbooks/FIRST_PILOT_TROUBLESHOOTING.md`](runbooks/FIRST_PILOT_TROUBLESHOOTING.md) (symptom tree) · [`runbooks/PILOT_RESCUE_PLAYBOOK.md`](runbooks/PILOT_RESCUE_PLAYBOOK.md) (quick matrix).

---

## 2. Canonical depth and commands

| Need | Doc |
|------|-----|
| **Single first-pilot path** (storage → evidence → commit → export → next action) | [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| **Accelerator pack index** (Azure SaaS, AI governance, healthcare) | [`library/walkthroughs/README.md`](library/walkthroughs/README.md) |
| Step-by-step UI + “what good looks like” | [`onboarding/EVALUATION_GUIDE.md`](onboarding/EVALUATION_GUIDE.md) (**Part 2 — Core Pilot**) |
| Azure SaaS readiness — buyer outcome | [`go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md`](go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md) · walkthrough [`library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md`](library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md) |
| AI governance — buyer outcome | [`go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md`](go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md) · walkthrough [`library/walkthroughs/AI_GOVERNANCE_REVIEW.md`](library/walkthroughs/AI_GOVERNANCE_REVIEW.md) |
| Healthcare claims policy — buyer outcome | [`go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md) · walkthrough [`library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) |
| V1 vs V1.1 integration boundaries | [`go-to-market/INTEGRATION_CATALOG.md`](go-to-market/INTEGRATION_CATALOG.md) |
| CLI / curl spine (repository root) | [`library/OPERATOR_QUICKSTART.md`](library/OPERATOR_QUICKSTART.md) |
| First-session wizard in the hosted operator shell | `/onboarding` (in-product); see [`library/FIRST_RUN_WIZARD.md`](library/FIRST_RUN_WIZARD.md) |

---

## First session checklist

**In-product:** operator **Home** shows the **First-pilot operating path** (six steps: setup → evidence → create → execute → finalize → sponsor packet). **Docs depth:** four-step narrative below matches [**onboarding/EVALUATION_GUIDE.md**](onboarding/EVALUATION_GUIDE.md) Part 2.

Four steps — canonical sequence for sponsor-facing copy:

### Step-by-step walkthrough

1. **Create** an architecture review (operator **New review** wizard or **`archlucid run`** CLI with project inputs — the CLI verb remains `run` for backward compatibility).
2. **Execute** the **review** (pipeline) and let the coordinator complete the work (timeline on the **review detail** page — legacy routes may still use `/runs/`).

### Review manifest and artifacts

3. **Commit** the manifest (produces golden manifest + synthesized artifacts — nothing exportable before this step).
4. **Open** the review package — manifest summary, artifacts table, and bundle export on the **review detail** page.

**Sponsor-visible artifact:** after commit, use the operator **review detail** (**“Email this review to your sponsor”** banner when manifest exists; exact UI copy may still say *run* until label-only updates land) plus **[`go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** for narrative context.
