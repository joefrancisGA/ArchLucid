> **Scope:** Single first-pilot operator path — storage/auth through sponsor export and next action; V1 surfaces only (no V1.1 connectors in required steps).

# First-pilot operator path (V1)

**Audience:** Buyer operators, design partners, and sales engineers guiding a first architecture review without jumping across unrelated docs.

**Last reviewed:** 2026-05-27

**Canonical four-step narrative:** [`CORE_PILOT.md`](../CORE_PILOT.md). **Evidence checklist (printable):** [`FIRST_RUN_EVIDENCE_CHECKLIST.md`](FIRST_RUN_EVIDENCE_CHECKLIST.md). **Stuck mid-pilot:** [`PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md).

---

## Grounding rule

Every step below maps to a **shipped** API, operator UI route, or CLI verb. Optional accelerators use only V1 policy packs and ingest paths — **Jira**, **ServiceNow**, **Confluence**, **Slack**, **Teams**, and broad outbound webhooks are **V1.1** and appear only under *Optional later*.

---

## Phase A — Platform ready

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| A1 | Configure SQL connection string, `ArchLucidAuth:Mode`, and hosting role (`Hosting:Role` for API and/or Worker). | `GET /health/ready` returns **Healthy** (or documented degraded entries are accepted). | API · [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) |
| A2 | Start API + worker (or combined host); confirm DbUp migrations applied. | `GET /version` returns build identity; logs show catalog ready. | API · [`PILOT_GUIDE.md`](../library/PILOT_GUIDE.md) |
| A3 | Sign in to operator UI (`/auth/signin` or dev bypass locally only). | Home loads; no endless 401/403 on `/api/proxy`. | UI · [`FIRST_RUN_WIZARD.md`](../library/FIRST_RUN_WIZARD.md) |

**Failure recovery (Phase A):** auth loops → [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md) · SQL/migration errors → [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) · capture **`X-Correlation-ID`** on every failed API call.

---

## Phase B — Evidence ingest (Azure Tier 1)

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| B1 | Run **Azure extractor Tier 1** in the **customer** subscription (read-only PowerShell; no ArchLucid secrets in customer tenant). | ZIP contains `manifest.json` and cost/inventory payloads. | Customer script · [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) |
| B2 | *(Alternative)* Use **demo evidence** only for evaluator dry-runs: open Workspace A Product Tour review (no extractor required). | Review detail shows committed manifest + artifacts. | UI · [`go-to-market/DEMO_WORKSPACES.md`](../go-to-market/DEMO_WORKSPACES.md) |

**Failure recovery (Phase B):** extractor script errors → [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) § troubleshooting · wrong scope headers on demo URLs → DEMO_WORKSPACES scope triplet table.

---

## Phase C — Review lifecycle

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| C1 | **Create** architecture review — operator **New review** (`/runs/new`) or `archlucid run create`. | Review appears in **Reviews** with status progressing past **Created**. | UI · CLI · `POST /v1/architecture/request` |
| C2 | **Upload extractor ZIP** to the review (`POST /v1/azure-extractor/upload` or review-detail upload). | Upload 200; ingest event in timeline. | API · UI |
| C3 | **Execute** agents on the review. | Status **Ready for commit** (or explicit failure with correlation id). | `POST /v1/architecture/run/{runId}/execute` · pipeline timeline |
| C4 | *(Optional)* Assign a **V1 policy pack** and run pre-commit dry-run when governance is in pilot scope. | Dry-run shows blocking vs warning findings. | `POST /v1/governance/policy-packs/dry-run` · [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) |
| C5 | **Commit** golden manifest. | Manifest id visible; artifacts table non-empty. | `POST /v1/architecture/run/{runId}/commit` · review detail **Finalize** |

**Failure recovery (Phase C):** execute stalls → [`PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md) · pre-commit blocked → disposition findings per gate doc · commit 409 → governance extension `#governance-pre-commit-blocked`.

---

## Phase D — Review package and sponsor export

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| D1 | Inspect **findings**, explanation aggregate, and **artifacts** on review detail. | Sponsor-readable summary; severity badges; evidence refs present. | UI review detail · `GET /v1/architecture/run/{runId}` |
| D2 | Export **sponsor packet** (markdown/DOCX/PDF per tenant config) or **Email this review to your sponsor** when manifest exists. | Download succeeds; ROI basis labels show evidence source (not placeholder-only unless static demo). | UI exports · [`go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) |
| D3 | Record **run id**, manifest id, and any **`X-Correlation-ID`** for support before escalating. | Ticket-ready notes. | [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md) |

---

## Phase E — Decide next action

| Outcome | Next step | Doc |
|---------|-----------|-----|
| Pilot proved value; sponsor wants depth | Stay on **Pilot** for a second real review, or open **Operate (analysis)** for compare/replay/graph only if a concrete question appears. | [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md) |
| Governance / audit questions emerged | Enable **Operate (governance)** — policy packs, approvals, audit log. | [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md) Layer B.2 |
| Need a vertical accelerator narrative | Run a packaged walkthrough (V1 only). | [`library/walkthroughs/`](../library/walkthroughs/) (see below) |
| Stuck or regressed | Symptom index + rescue playbook. | [`PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md) |

**Accelerator walkthroughs (buyer-recognizable, V1-only):**

| Walkthrough | Buyer outcome |
|-------------|----------------|
| [Azure SaaS readiness review](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md) | WAF-aligned + SaaS security baseline on Azure evidence |
| [AI governance review](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) | Responsible-AI policy pack, findings, governance decision, sponsor export |
| [Healthcare claims pilot](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) | Regulated healthcare pack + PHI storyline (demo seed) |

---

## Optional later (not required for first-pilot success)

- First-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, **Teams** — [`INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) (V1.1)
- MCP tool membrane, live Stripe/Marketplace commerce, hosted Tier 2 extractor WIF

---

## Related

- [`START_HERE.md`](../START_HERE.md) — role routing
- [`onboarding/EVALUATION_GUIDE.md`](../onboarding/EVALUATION_GUIDE.md) — evaluator depth
- [`library/operator-shell.md`](../library/operator-shell.md) — UI layer map
- [`library/LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) — scripted HTTP parity
