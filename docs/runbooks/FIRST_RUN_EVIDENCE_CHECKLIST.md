> **Scope:** V1 pilot first-run evidence checklist for buyer operators — Azure extractor Tier 1 path, pre-demo and design-partner kickoff validation; Tier 2 WIF is optional (see end of page).

# First-run evidence checklist (V1 pilot)

**Last reviewed:** 2026-05-26

**Audience:** Buyer operators running the default V1 pilot path (Azure extractor Tier 1, no vendor-held cloud credentials).

Use this checklist before a sponsor demo or design-partner kickoff. Each step links to deeper docs; this page stays under two printed pages.

| Step | Action | Success signal | Deeper doc |
|------|--------|----------------|------------|
| 1 | Configure SQL connection string and auth mode for your environment (`ArchLucidAuth:Mode`, Entra/OIDC/SAML, or dev bypass locally only). | API starts; `GET /health/ready` returns **Healthy** (or expected degraded entries are understood). | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md), [`SECURITY.md`](../library/SECURITY.md) |
| 2 | Start API + worker (or combined host) with correct `Hosting:Role`. | `/version` returns build identity; logs show migrations applied. | [`PILOT_GUIDE.md`](../library/PILOT_GUIDE.md) |
| 3 | Run **Azure extractor Tier 1** in the customer subscription (PowerShell, read-only, no ArchLucid secrets in customer tenant). | Script completes; ZIP contains `manifest.json` and cost/inventory payloads. | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) |
| 4 | Sign in to operator UI; open **New review** (`/runs/new`). | Wizard loads; auth succeeds (no endless 401/403). | [`FIRST_RUN_WALKTHROUGH.md`](../library/FIRST_RUN_WALKTHROUGH.md) |
| 5 | Create architecture request and note **run id** from success path or review list. | Run appears in **Reviews** with status **Tasks generated** or later. | [`operator-shell.md`](../library/operator-shell.md) |
| 6 | **Upload extractor ZIP** to the review (`POST /v1/azure-extractor/upload` or UI equivalent). | Upload returns 200; audit/event log shows ingest; evidence attached to run. | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) § ingest |
| 7 | **Execute** agents on the review. | Run reaches **Ready for commit** (or explicit failure with `X-Correlation-ID`). | [`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) |
| 8 | **Commit** golden manifest. | Manifest id visible; artifacts list non-empty. | [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.1 |
| 9 | Inspect **artifacts**, findings, and explanation aggregate. | Sponsor-facing summary loads; ROI/savings labels show basis text when present. | [`FIRST_RUN_WALKTHROUGH.md`](../library/FIRST_RUN_WALKTHROUGH.md) |
| 10 | Export **sponsor packet** (markdown/DOCX/PDF as configured). | File downloads; no placeholder-only demo unless intentionally using static demo run. | [`PILOT_GUIDE.md`](../library/PILOT_GUIDE.md) |
| 11 | Capture **`X-Correlation-ID`** (and run id) for any failed step before opening support. | IDs recorded in ticket/runbook notes. | [`TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) |

## Optional Tier 2 (hosted extractor WIF)

When ArchLucid hosts extraction against customer subscriptions via workload identity federation, run customer templates **once per subscription** before Tier 2 pull:

- [`deploy/customer-templates/README.md`](../../deploy/customer-templates/README.md)
- Validate locally: `python scripts/ci/validate_customer_wif_templates.py`

## Out of scope for V1 first-run (do not block pilot)

- Jira, ServiceNow, Confluence, Slack, Teams first-party connectors (V1.1)
- Live Stripe checkout or Marketplace drawdown (owner-gated)
- MCP retrieval tools (later)

## Related

- [`runbooks/PILOT_RESCUE_PLAYBOOK.md`](PILOT_RESCUE_PLAYBOOK.md) — symptom index when stuck mid-pilot
- [`library/LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) — scripted HTTP parity
