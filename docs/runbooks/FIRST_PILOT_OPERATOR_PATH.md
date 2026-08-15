> **Scope:** Internal SE/ops runbook — platform readiness, printable first-run evidence checklist, pilot proof collection, phase-level recovery, and time-boxed first value in 20 minutes. Absorbs the former `FIRST_RUN_EVIDENCE_CHECKLIST.md` body. **Not the default customer help path.** Customer architects: use [Your first architecture review](/help/first-architecture-review).

# First-pilot operator path (internal runbook)

**Audience:** Design partners, sales engineers, and platform admins guiding a first architecture review. In-app access is **Admin-only** (`/help/first-value-20-minutes`).

**Persona map (operator / platform / release owner):** [`ROLE_INDEX.md`](ROLE_INDEX.md).

**Last reviewed:** 2026-08-03

**Canonical seven-step minimum path:** [`../library/CANONICAL_FIRST_RUN_PATH.md`](../library/CANONICAL_FIRST_RUN_PATH.md) (command wrapper: `scripts/Run-CanonicalFirstPilotPath.ps1`). **Canonical four-step narrative:** [`CORE_PILOT.md`](../CORE_PILOT.md). **This file is the canonical operational checklist.** **Before you start (Azure + config):** [`PILOT_PREREQUISITES.md`](PILOT_PREREQUISITES.md). **Production-like preflight:** [`FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md`](FIRST_PILOT_PRODUCTION_LIKE_PREFLIGHT.md). **Time-boxed evaluators:** Â§ **First value in 20 minutes** below. **In-product rail:** operator **Home** → **First-pilot path (about 20 minutes)** strip. **Starter pack chooser:** [`templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md`](../../templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md). **Golden walkthrough:** [`DEMO_QUICKSTART.md#golden-accelerator-walkthrough-regulated-saas`](../go-to-market/DEMO_QUICKSTART.md#golden-accelerator-walkthrough-regulated-saas) (`GOLDEN_ACCELERATOR_WALKTHROUGH.md` alias). **Evidence checklist (printable):** [#printable-first-run-evidence-checklist](#printable-first-run-evidence-checklist) (`FIRST_RUN_EVIDENCE_CHECKLIST.md` alias). **Stuck mid-pilot:** [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) Â· **Support triage:** [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md).


## Inputs, outputs, and stop conditions

| | What you need | What success produces | When to stop |
| --- | --- | --- | --- |
| **Inputs** | SQL + auth configured, evidence uploaded or demo accepted, one architecture run executed and **committed** | — | Do not sponsor-send while `sponsorPacketDisposition` is **HOLD** or data-consistency is **NOT_RUN** in sponsor-handoff mode |
| **Outputs** | — | `first-pilot-command-center.md`, `go-no-go-summary.md`, committed-run `first-value-report.md` + PDF, `quote-to-proof-packet.md`, proof folder under `artifacts/first-pilot-proof/`, run-scoped folder via `archlucid pilot proof-packet <runId>` | Stop external circulation when ROI basis is demo-derived or PilotStrict failed without caveat |

**Do not start here for the checklist:** [`BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) (buyer pass/hold depth only), [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) (recovery only), [`architecture/README.md`](../architecture/README.md) (contributor map).

## Successful first-pilot output artifacts

When Phase D completes with `-RunId` and sponsor handoff flags as needed, expect at minimum:

| Artifact | Path (under proof working dir) |
| --- | --- |
| Command center (primary) | `first-pilot-command-center.md` |
| Go/no-go findings | `go-no-go-summary.md` Â· `go-no-go-summary.json` |
| Committed-run bundle | `first-pilot-evidence/` (first-value report, observability summary, deltas) |
| Commercial index | `quote-to-proof-packet.md` Â· `commercial-next-step.json` Â· `commercial-closeout.md` |
| Run detail first-screen proof status | Architect workspace **Run detail** → **Proof status** strip (READY/WARN/HOLD from `pilot-run-deltas`) |
| Data consistency | `data-consistency-readiness/data-consistency-summary.json` |
| Config / drift (hosted) | `config-lint-production-like-hosted-pilot.md` Â· `route-tier-policy-nav-parity.md` |

Do not hand-edit missing proof into the packet — re-run collectors per [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md).


## Operator status vocabulary

Use this small vocabulary across cockpit rows, proof summaries, and sponsor handoff — do not invent parallel checklists.

| Label | Meaning | Typical next step |
| --- | --- | --- |
| **READY** | Row or phase is green for first-pilot work | Continue to the linked surface |
| **WARN** | Review before sponsor send or external circulation | Open the linked runbook row |
| **HOLD** | Blocking for sponsor handoff or procurement follow-up | Resolve blockers, re-run proof |
| **DEFERRED** | Explicitly out of V1 first-pilot scope (V1.1/V2/(B)) | Record in proof `-DeferredBuyerRequirement`; use `DEFERRED_SCOPE` disposition |
| **NEXT ACTION** | One primary link on architect Home command center | Follow the phase card CTA only |

**Canonical operational checklist:** this file. **Canonical narrative:** [`CORE_PILOT.md`](../CORE_PILOT.md). **Post-finalize evidence:** [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md).


## Grounding rule

Every step below maps to a **shipped** API, architect workspace route, or CLI verb. Optional accelerators use only V1 policy packs and ingest paths — **Jira**, **ServiceNow**, **Confluence**, **Slack**, **Teams**, and broad outbound webhooks are **V1.1** and appear only under *Optional later*.


## Printable first-run evidence checklist {#printable-first-run-evidence-checklist}

Former standalone body: `docs/runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md` → this section (filename kept as a path-stable alias). Use before a sponsor demo or design-partner kickoff when you want a **printable table** under two pages; Phases A–D below are the same work with failure recovery.

**Audience:** Sales engineers and platform admins (Azure extractor Tier 1, no vendor-held cloud credentials). **In-app:** Admin-only `/help/first-review`. Customer architects: [Your first architecture review](/help/first-architecture-review).

| Step | Action | Success signal | Deeper doc |
|------|--------|----------------|------------|
| 1 | Configure SQL connection string and auth mode for your environment (`ArchLucidAuth:Mode`, Entra/OIDC/SAML, or dev bypass locally only). | API starts; `GET /health/ready` returns **Healthy** (or expected degraded entries are understood). | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md), [`SECURITY.md`](../library/contributor-reference/SECURITY.md) |
| 2 | Start API + worker (or combined host) with correct `Hosting:Role`. | `/version` returns build identity; logs show migrations applied. | [`PILOT_GUIDE.md`](../library/customer-facing/PILOT_GUIDE.md) |
| 3 | Run **Azure extractor Tier 1** in the customer subscription (PowerShell, read-only, no ArchLucid secrets in customer tenant). | Script completes; ZIP contains `manifest.json` and cost/inventory payloads. | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) |
| 4 | Sign in to architect workspace; open **New architecture review** (`/architecture/reviews/new`; retired bookmark). | Wizard loads; auth succeeds (no endless 401/403). | [`CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough`](../library/CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough) |
| 5 | Create architecture request and note **run id** from success path or review list. | Review appears in **Reviews** with status **Tasks generated** or later. | [`WORKSPACE_NAVIGATION_GUIDE.md`](../library/customer-facing/WORKSPACE_NAVIGATION_GUIDE.md) |
| 6 | **Upload extractor ZIP** to the review (`POST /v1/azure-extractor/upload` or UI equivalent). | Upload returns 200; audit/event log shows ingest; evidence attached to run. | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) Â§ ingest |
| 7 | **Execute** agents on the review. | Review reaches **Ready to finalize** (or explicit failure with `X-Correlation-ID`). | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) |
| 8 | **Finalize** the architecture package (sealed review record). | Sealed review record visible; artifacts list non-empty. | [`V1_SCOPE.md`](../library/V1_SCOPE.md) Â§2.1 |
| 9 | Inspect **artifacts**, findings, and explanation aggregate. | Sponsor-facing summary loads; ROI/savings labels show basis text when present. | [`CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough`](../library/CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough) |
| 10 | Export **sponsor packet** (markdown/DOCX/PDF as configured). | File downloads; no placeholder-only demo unless intentionally using static demo run. | [`PILOT_GUIDE.md`](../library/customer-facing/PILOT_GUIDE.md) |
| 11 | Capture **`X-Correlation-ID`** (and run id) for any failed step before opening support. | IDs recorded in ticket/runbook notes. | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) |

**Out of scope for V1 first-run (do not block pilot):** Jira, ServiceNow, Confluence, Slack, Teams first-party connectors (V1.1); live Stripe checkout or Marketplace drawdown (owner-gated); MCP retrieval tools (later).


## Optional Tier 2 (hosted extractor WIF) {#optional-tier-2-hosted-extractor-wif}

When ArchLucid hosts extraction against customer subscriptions via workload identity federation, run customer templates **once per subscription** before Tier 2 pull:

- [`deploy/customer-templates/README.md`](../../deploy/customer-templates/README.md)
- Validate locally: `python scripts/ci/validate_customer_wif_templates.py`


## Repeat review (run 2+) {#repeat-review-run-2}

After a second finalized architecture package, capture comparison-enriched stickiness proof:

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<second-finalized-run-id>' `
  -RunNumber 2 `
  -CompareBaseRunId '<first-finalized-run-id>'
```

See [`docs/library/REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md) for the full second-review checklist.


## First value in 20 minutes (time-boxed) {#first-value-in-20-minutes}

Shortest path from zero to a sponsor-safe artifact when platform wiring is already green. Use this section when the platform is already wired — not the full phased first-pilot checklist.

**Mode expectation:** Steps below work in **simulator** mode without Azure OpenAI credentials. Label outputs **Simulator** unless you configured real-mode and collected live LLM evidence.

### Prerequisites (5 min)

1. API reachable (`GET /health/live` returns 200).
2. SQL persistence configured (or approved in-memory demo only — not for sponsor handoff).
3. `archlucid.json` in working directory with `apiBaseUrl` and auth (API key or scope headers).
4. Optional: `ARCHLUCID_API_KEY` in environment.

### Path (15 min)

| Step | Action | Expected output |
| --- | --- | --- |
| 1 | `dotnet run --project ArchLucid.Cli -- doctor` | Connection OK; auth mode summarized |
| 2 | Create + execute + finalize one review (UI **Home** checklist or CLI `archlucid run` → execute → commit) | Finalized run id (CLI/API still use `commit`) |
| 3 | `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId> --out artifacts/proof-packet/<runId>` | Folder: `proof-summary.md`, `run-evidence.json`, `audit-sample.json`, `artifact-manifest.json`, `environment.json`, `limitations.md` |
| 3 (combined) | `dotnet run --project ArchLucid.Cli -- try --sponsor-packet --out artifacts/proof` | Zero-to-proof in one command: Docker up → demo seed → sample run → commit → sponsor folder with `proof-summary.md` (default out: `artifacts/try-sponsor-packet/<runId>`) |
| 4 | Review `proof-summary.md` **Sponsor first-page status** block | Evidence source, quality disposition, ROI basis, next action |
| 5 | Optional sponsor ZIP: `dotnet run --project ArchLucid.Cli -- buyer-proof-pack <runId> --out artifacts/buyer-proof.zip` | Email-sized ZIP for executives |

### Failure triage (stop here — do not skip)

| Symptom | Next step |
| --- | --- |
| SQL / ready failures | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) → health/ready |
| Auth 401/403 | [`PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md`](PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md) |
| Quality gate rejected | API `supportHint` + [`QUALITY_GATE_REJECTION.md`](QUALITY_GATE_REJECTION.md) |
| No artifacts after finalize | Re-run execute; confirm finalized status before proof packet |
| LLM budget / quota | [`../library/OPERATIONS_LLM_QUOTA.md`](../library/OPERATIONS_LLM_QUOTA.md) |

### After this path

- Full environment proof: `./scripts/collect-first-pilot-proof.ps1 -BaseUrl <url> -RunId <runId>`
- Support bundle: `dotnet run --project ArchLucid.Cli -- support-bundle --run-id <runId> --zip`
- Depth: [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)


## First value in 20 minutes (time-boxed)

Shortest path from zero to a sponsor-safe artifact when platform wiring is already green. For the full phased checklist, continue with Â§ **Phase A** below.

**Mode expectation:** Steps below work in **simulator** mode without Azure OpenAI credentials. Label outputs **Simulator** unless you configured real-mode and collected live LLM evidence.

### Prerequisites (5 min)

1. API reachable (`GET /health/live` returns 200).
2. SQL persistence configured (or approved in-memory demo only — not for sponsor handoff).
3. `archlucid.json` in working directory with `apiBaseUrl` and auth (API key or scope headers).
4. Optional: `ARCHLUCID_API_KEY` in environment.

### Path (15 min)

| Step | Action | Expected output |
| --- | --- | --- |
| 1 | `dotnet run --project ArchLucid.Cli -- doctor` | Connection OK; auth mode summarized |
| 2 | Create + execute + commit one review (UI **Home** checklist or CLI `archlucid run` → execute → commit) | Committed run id |
| 3 | `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId> --out artifacts/proof-packet/<runId>` | Folder: `proof-summary.md`, `run-evidence.json`, `audit-sample.json`, `artifact-manifest.json`, `environment.json`, `limitations.md` |
| 3 (combined) | `dotnet run --project ArchLucid.Cli -- try --sponsor-packet --out artifacts/proof` | Zero-to-proof in one command: Docker up → demo seed → sample run → commit → sponsor folder with `proof-summary.md` (default out: `artifacts/try-sponsor-packet/<runId>`) |
| 4 | Review `proof-summary.md` **Sponsor first-page status** block | Evidence source, quality disposition, ROI basis, next action |
| 5 | Optional sponsor ZIP: `dotnet run --project ArchLucid.Cli -- buyer-proof-pack <runId> --out artifacts/buyer-proof.zip` | Email-sized ZIP for executives |

### Failure triage (stop here — do not skip)

| Symptom | Next step |
| --- | --- |
| SQL / ready failures | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) → health/ready |
| Auth 401/403 | [`PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md`](PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md) |
| Quality gate rejected | API `supportHint` + [`QUALITY_GATE_REJECTION.md`](QUALITY_GATE_REJECTION.md) |
| No artifacts after commit | Re-run execute; confirm committed status before proof packet |
| LLM budget / quota | [`../library/OPERATIONS_LLM_QUOTA.md`](../library/OPERATIONS_LLM_QUOTA.md) |

### After this path

- Full environment proof: `./scripts/collect-first-pilot-proof.ps1 -BaseUrl <url> -RunId <runId>`
- Support bundle: `dotnet run --project ArchLucid.Cli -- support-bundle --run-id <runId> --zip`
- Depth: [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)


## Pilot UI deployment (buyer-default shell)

Before provisioning a **pilot or staging tenant UI**, confirm the build **does not** set `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`. When that flag is unset, the architect workspace uses buyer-polished labels (no AI budget pill in the header, outcome-first pipeline status copy). Local engineers keep the dense shell via `archlucid-ui/.env.development` only.

| Check | Pass criteria |
| --- | --- |
| Env template | Use [`archlucid-ui/.env.pilot.example`](../../archlucid-ui/.env.pilot.example) as the starting point — flag absent |
| CI guard | `python scripts/ci/assert_pilot_ui_env_posture.py` exits 0 |
| Symptom if misconfigured | Header shows **AI budget** pill; nav uses **Evidence intake** / pipeline jargon |

Canonical reference: [`OPERATOR_UI_EXPERIENCE_MODES.md`](../library/OPERATOR_UI_EXPERIENCE_MODES.md).


## Phase A — Platform ready

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| A1 | Configure SQL connection string, `ArchLucidAuth:Mode`, and hosting role (`Hosting:Role` for API and/or Worker). | `GET /health/ready` returns **Healthy** (or documented degraded entries are accepted). | API Â· [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) |
| A0a | Run prerequisites check for your target profile (`.\scripts\Test-ArchLucidPrerequisites.ps1 -Profile FirstPilotMinimum` or `ProductionLike`). | No **BLOCK** rows; Azure AI Search callout understood for production-like. | [`PILOT_PREREQUISITES.md`](PILOT_PREREQUISITES.md) |
| A0 | Run one-command pilot readiness preflight: `archlucid pilot preflight` (use `--no-api` for offline config-only check; `--include-itsm` to probe ITSM health; `--md --markdown-out report.md` for an owner-ready markdown summary; `--json` for CI). Checks: config + auth lint, execution mode, Azure AI Search endpoint, proof-packet claim-lint rules, API health, OpenAPI contract. | No **BLOCK** rows; WARN rows reviewed and understood. | CLI Â· [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| A0b | *(Preferred handoff)* Run the proof pipeline without `-RunId` for readiness-only go/no-go. | **`first-pilot-command-center.md`** shows phased **READY/WARN/HOLD**; missing finalized review is **WARN** (not a crash). Full findings table: `go-no-go-summary.md`. | `./scripts/collect-first-pilot-proof.ps1` |
| A2 | Start API + worker (or combined host); confirm DbUp migrations applied. | `GET /version` returns build identity; logs show catalog ready. | API Â· [`PILOT_GUIDE.md`](../library/customer-facing/PILOT_GUIDE.md) |
| A3 | Sign in to architect workspace (`/auth/signin` or dev bypass locally only). | Home loads; no endless 401/403 on `/api/proxy`. | UI Â· [`CANONICAL_FIRST_RUN_PATH.md#first-run-wizard-architect-workspace`](../library/CANONICAL_FIRST_RUN_PATH.md#first-run-wizard-architect-workspace) |

**Failure recovery (Phase A):** auth loops → [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) Â§ auth Â· `archlucid auth diagnostics` (admin API key) Â· SQL/migration errors → [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) Â· capture **`X-Correlation-ID`** on every failed API call.

### Ignore for first pilot

Until you have one **finalized** architecture package, you do **not** need: Operate compare/replay/graph lanes, V1.1 connectors, MCP, live commerce, or reading the full V1 integration catalog. Optional policy-pack dry-run (step C4) is the only governance touch in the default path.


## Phase B — Evidence ingest (Azure Tier 1)

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| B1 | Run **Azure extractor Tier 1** in the **customer** subscription (read-only PowerShell; no ArchLucid secrets in customer tenant). Share [`BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-extractor--infosec-pre-read`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-extractor--infosec-pre-read) with InfoSec if approval is required. | ZIP contains `manifest.json` and cost/inventory payloads. | Customer script Â· [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) Â· InfoSec pre-read |
| B2 | *(Alternative)* Use **demo evidence** only for evaluator dry-runs: open Workspace A Product Tour review (no extractor required). | Review detail shows committed manifest + artifacts. | UI Â· [`go-to-market/DEMO_WORKSPACES.md`](../go-to-market/DEMO_WORKSPACES.md) |

**Failure recovery (Phase B):** extractor script errors → [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) Â§ troubleshooting Â· wrong scope headers on demo URLs → DEMO_WORKSPACES scope triplet table.


## Phase C — Review lifecycle

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| C1 | **Create** architecture review — architect workspace **New review** (`/architecture/reviews/new`; retired bookmark) or `archlucid run create`. | Review appears in **Reviews** with status progressing past **Created**. | UI Â· CLI Â· `POST /v1/architecture/request` |
| C2 | **Upload extractor ZIP** to the review (`POST /v1/azure-extractor/upload` or review-detail upload). | Upload 200; ingest event in timeline. | API Â· UI |
| C3 | **Execute** agents on the review. | Status **Ready to finalize** (API/CLI may still show `ReadyForCommit`; or explicit failure with correlation id). | `POST /v1/architecture/review/{runId}/execute` Â· pipeline timeline |
| C4 | *(Optional)* Assign a **V1 policy pack** and run pre-finalize dry-run when governance is in pilot scope. | Dry-run shows blocking vs warning findings. | `POST /v1/governance/policy-packs/dry-run` Â· [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) |
| C5 | **Finalize** architecture package. | Package / manifest id visible; artifacts table non-empty. | `POST /v1/architecture/review/{runId}/finalize` Â· review detail **Finalize** |

**Failure recovery (Phase C):** execute stalls → [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) Â· pre-finalize blocked → disposition findings per gate doc Â· finalize/commit 409 → governance extension `#governance-pre-commit-blocked`.


## Phase D — Architecture package and sponsor export

| Step | Action | Success signal | Surface |
|------|--------|----------------|---------|
| D1 | Inspect **findings**, explanation aggregate, and **artifacts** on review detail. | Sponsor-readable summary; severity badges; evidence refs present. | UI review detail Â· `GET /v1/architecture/review/{runId}` |
| D1b | Follow the **Next after finalize** card: one **primary** action (sponsor packet) plus optional compare, evidence chain, governance dry-run, or quote-to-proof index. | Primary CTA scrolls to sponsor deliverables; optional links stay secondary. | Review detail post-finalize habit loop |
| D2a | Capture **ROI baseline** labels before sponsor send (review-cycle hours, architect prep, documentation effort, evidence assembly; source: buyer-provided / defaulted / demo-derived / not collected). In the **Full Wizard** on [`/architecture/reviews/new`](../../archlucid-ui/src/app/(operator)/architecture/reviews/new/page.tsx), the optional **Baseline metrics** step persists review-cycle hours via `PUT /v1/tenant/baseline` before review submit (skip leaves scorecard defaults). | Scorecard rows populated or explicitly **not collected**; proof marks demo-derived as walkthrough-only. | [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md) Â§2 Â· `go-no-go-summary.json` Â· `roiBasisStatus` |
| D2 | Export **sponsor packet** (markdown/DOCX/PDF per tenant config) or **Email this review to your sponsor** when manifest exists. | Download succeeds; ROI basis labels show evidence source (not placeholder-only unless static demo). | UI exports Â· [`go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) |
| D3 | Record **run id**, manifest id, and any **`X-Correlation-ID`** for support before escalating. | Ticket-ready notes. | [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md) |
| D4 | Collect first-pilot proof with `-RunId` for sponsor/procurement handoff. | **`first-pilot-command-center.md`** (primary status) plus `go-no-go-summary.md` and committed-run evidence folder with checksum manifest and buyer-safe artifacts. Production-like or sponsor handoff also collects `config-lint-production-like-hosted-pilot.md`, `route-tier-policy-nav-parity.md`, and `procurement-deal-ready-check.txt` (deal-ready **PASS/HOLD**). | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| D5 | *(Optional workflow handoff)* Attach proof artifacts to a GitHub PR/issue or Azure DevOps work item. | Work item links to the sponsor packet, evidence manifest, and send/hold status without requiring a V1.1 connector. | [`V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md) |


## Phase E — Decide next action

| Outcome | Next step | Doc |
|---------|-----------|-----|
| Pilot proved value; sponsor wants depth | Stay on **Pilot** for a second real review (see [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md)), or open **Operate (analysis)** for compare/replay/graph only if a concrete question appears. | [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md) |
| Governance / audit questions emerged | Enable **Operate (governance)** — policy packs, approvals, audit log. | [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md) Layer B.2 |
| Need a **Specialty** buyer-job narrative (optional — after first Core value) | Choose a Specialty template from [`library/walkthroughs/README.md`](../library/walkthroughs/README.md) (Azure SaaS, AI governance, healthcare). | Buyer-job pages under [`go-to-market/buyer-jobs/`](../go-to-market/buyer-jobs/) |
| Stuck or regressed | Symptom index + troubleshooting decision tree. | [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) |

**Specialty accelerator templates (optional, V1-only):** index [`library/walkthroughs/README.md`](../library/walkthroughs/README.md). These are **not** mandatory before first Core finalize.

| Walkthrough | Buyer outcome |
|-------------|----------------|
| [Azure SaaS readiness review](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md) | WAF-aligned + SaaS security baseline on Azure evidence |
| [AI governance review](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) | Responsible-AI policy pack, findings, governance decision, sponsor export |
| [Healthcare claims pilot](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) | Regulated healthcare pack + PHI storyline (demo seed) |


## Optional later (not required for first-pilot success)

- First-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, **Teams** — [`INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) (V1.1)
- MCP tool membrane, live Stripe/Marketplace commerce, hosted Tier 2 extractor WIF


## Related

- [`START_HERE.md`](../START_HERE.md) — role routing (**hub**) and [`CORE_PILOT.md`](../CORE_PILOT.md) — four-step narrative (**read second**)
- [`BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) — buyer pass/hold + next-step chooser (not a second checklist)
- [`library/operator-shell.md`](../library/operator-shell.md) — **depth** UI layer map
- [`library/LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) — **depth** scripted HTTP parity
