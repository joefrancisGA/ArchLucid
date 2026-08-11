> **Scope:** Customer-facing — Canonical architect action map — UI routes, APIs, CLI, and authority hints in one place.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Operator atlas

**Audience:** Architects, reviewers, and engineers who need a **single map** from product intent → **architect workspace route** → **HTTP surface** → **CLI** without opening ten onboarding files.

**Source of truth for nav:** `archlucid-ui/src/lib/nav-config.ts` (labels, `tier`, `requiredAuthority`) composed with `nav-shell-visibility.ts`. **Authoritative authorization** remains **`[Authorize(Policy = …)]`** on `ArchLucid.Api` — the UI only shapes disclosure.

**Related:** [CORE_PILOT.md](../CORE_PILOT.md) Â· [OPERATOR_QUICKSTART.md](customer-facing/OPERATOR_QUICKSTART.md) Â· [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) Â· [operator-shell.md](operator-shell.md) Â· [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) Â§3 Â· [API_CONTRACTS.md](API_CONTRACTS.md)

---

## Core Pilot — essential (default sidebar)

| Action | CLI (examples) | Primary API | Architect workspace | Authority (nav hint) | Runbook / doc |
|--------|----------------|-------------|-------------|------------------------|---------------|
| Health / readiness | `dotnet run --project ArchLucid.Cli -- health` | `GET /health/live`, `GET /health/ready` | — | Anonymous | [BUILD.md](../engineering/BUILD.md) |
| Version | `dotnet run --project ArchLucid.Cli -- doctor` | `GET /version` | — | Read (doctor) | [README.md](../REPOSITORY_README.md) |
| Create architecture request | `dotnet run --project ArchLucid.Cli -- run` | `POST /v1/architecture/request` | `/architecture/reviews/new` (retired bookmark) | Execute (wizard submit) | [CORE_PILOT — walkthrough](../CORE_PILOT.md#step-by-step-walkthrough) |
| Poll review / pipeline | `… status <runId>` | `GET /v1/architecture/review/{runId}` | `/architecture/reviews/{runId}` | Read | [OPERATOR_QUICKSTART.md](customer-facing/OPERATOR_QUICKSTART.md) |
| Finalize architecture package | `… commit <runId>` | `POST /v1/architecture/review/{runId}/finalize` | Run detail → **Finalize** | Execute | [CORE_PILOT — walkthrough](../CORE_PILOT.md#step-by-step-walkthrough) |
| Package + artifacts | `… artifacts <runId> [--save]` | `GET /v1/architecture/manifest/{version}`, artifact routes | Run detail | Read | [CORE_PILOT — manifest & artifacts](../CORE_PILOT.md#review-manifest-and-artifacts) |
| Home / pilot checklist | `… try`, `… pilot up` | tenant + health reads | `/` | Read | [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) |
| Getting started / trial checklist | — | `GET /v1/tenant/trial-status`, registration session, same checklist as Home | `/getting-started` | Read | [TRIAL_SIGNUP_UI.md](../../archlucid-ui/docs/TRIAL_SIGNUP_UI.md), [PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) |
| Sponsor PDF (post-finalize) | `… sponsor-one-pager <runId> [--save]` | export endpoints on run | Run detail → exports | Read / Execute per op | [CORE_PILOT.md](../CORE_PILOT.md), [CLI_USAGE.md](CLI_USAGE.md) |
| First-value Markdown | `… first-value-report <runId> [--save]` | value report API | Run detail | Read / Execute | [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md) |
| Workflow handoff | proof pipeline output | existing PR / issue / work item attachment | External GitHub / Azure DevOps | N/A (outside ArchLucid) | [V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md) |
| Recent finalized-review delta panel | — | `GET /v1/pilots/architecture/reviews/recent-deltas?count=N` | Top of `/architecture/reviews`, sidebar "Recent activity" card, inline on `/architecture/reviews/{runId}` | Read | [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md) (`BeforeAfterDeltaPanel`) |

---

## Core Pilot — extended (Show more links)

| Action | CLI | Primary API | Architect workspace | Authority | Runbook / doc |
|--------|-----|-------------|-------------|-----------|---------------|
| Graph / provenance | — | graph + run payloads | `/graph` | Read | [ARCHITECTURE_COMPONENTS.md](ARCHITECTURE_COMPONENTS.md) |
| Compare two reviews | `… comparisons …` | compare controllers | `/compare` | Read | [ARCHITECTURE_FLOWS.md Â§ Flow C](ARCHITECTURE_FLOWS.md#flow-c-comparison-lifecycle-compare--persist-record--replayexport--verify-drift) |
| Replay authority chain | `… trace <runId>` | replay endpoints | `/replay` | Execute | [CANONICAL_PIPELINE.md](CANONICAL_PIPELINE.md) |
| Demo telemetry / sponsor story | — | pilot + demo reads | `/why-archlucid` | Read | [DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md) |

---

## Operate (analysis workloads)

| Action | CLI | Primary API | Architect workspace | Authority | Runbook / doc |
|--------|-----|-------------|-------------|-----------|---------------|
| Ask (RAG Q&A) | — | Ask / retrieval routes | `/ask` | Read | [operator-shell.md](operator-shell.md) |
| Search indexed content | — | search APIs | `/search` | Read | [API_CONTRACTS.md](API_CONTRACTS.md) |
| Advisory hub (scans + schedules) | — | `/v1/advisory…`; `/v1/advisory-scheduling…` (CRUD) | `/advisory` (default **Scans**; **Schedules** `?tab=schedules`; legacy `/advisory-scheduling` → redirect) | Read (scans); schedules tab lists GET at Read, mutations Execute | [runbooks/ADVISORY_SCAN_FAILURES.md](../runbooks/ADVISORY_SCAN_FAILURES.md), [ARCHITECTURE_COMPONENTS.md](ARCHITECTURE_COMPONENTS.md) |
| Digests hub (browse + subs + schedule) | — | digest list reads; `/v1/digest-subscriptions…` (mutations); `/v1/tenant/exec-digest-preferences` (save) | `/digests` (default **Browse**; **Subscriptions** `?tab=subscriptions`; **Schedule** `?tab=schedule`; legacy `/digest-subscriptions` → redirect) | Read nav; subscription CRUD Execute; exec schedule GET Read, save Execute | [INTEGRATION_EVENTS_AND_WEBHOOKS.md](INTEGRATION_EVENTS_AND_WEBHOOKS.md), [CHANGELOG.md](../CHANGELOG.md) |
| Recommendation learning | — | learning APIs | `/recommendation-learning` | Read | [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) |
| Pilot feedback | — | feedback APIs | `/product-learning` | Read | [PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) |
| Planning themes | — | planning writes | `/planning` | Execute | [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) |
| Impact preview | — | evolution APIs | `/insights/impact-preview` | Read (simulate Execute) | [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) |

---

## Operate (governance and trust)

| Action | CLI | Primary API | Architect workspace | Authority | Runbook / doc |
|--------|-----|-------------|-------------|-----------|---------------|
| Alerts (hub) | — | `/v1/alerts…` and related alert APIs | `/governance/alerts` — **Inbox**; **Alert rules** hub `/governance/alert-rules` with **Conditions** `?tab=rules`; **Notifications** `?tab=notifications`; **Advanced rules** `?tab=advanced-rules`; **Test alerts** `?tab=test-alerts` (legacy `/alerts`, `/alert-routing`, and `?tab=routing` bookmarks fold via workbook migrations) | Read | [support/TIER_1_RUNBOOK.md](../support/TIER_1_RUNBOOK.md), [API_CONTRACTS.md](API_CONTRACTS.md) |
| Policy packs | — | `/v1/policy-packs…` | `/policy-packs` | Read / Admin on writes | [ARCHITECTURE_COMPONENTS.md](ARCHITECTURE_COMPONENTS.md) |
| Governance resolution (read) | — | effective governance | `/governance-resolution` | Read | [PRE_COMMIT_GOVERNANCE_GATE.md](PRE_COMMIT_GOVERNANCE_GATE.md) |
| Governance dashboard | — | dashboard aggregates | `/governance/dashboard` | Read | [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) |
| Governance workflow (mutations) | — | workflow POSTs | `/governance` | Execute | [COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md](COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md) |
| Audit log | — | `/v1/audit…` | `/audit` | Read (+ Auditor role for CSV where documented) | [support/TIER_1_RUNBOOK.md](../support/TIER_1_RUNBOOK.md) |
| Security & trust center | — | static + trust payloads | `/workspace/security-trust` (public table: `/security-trust`) | Read | [SECURITY.md](contributor-reference/SECURITY.md) |
| Trust Center evidence pack (ZIP) | — | `GET /v1/marketing/trust-center/evidence-pack.zip` | `/trust` (marketing — Download evidence pack button) | Anonymous | [go-to-market/trust-center.md](../go-to-market/trust-center.md) (one ZIP: DPA, subprocessors, SLA, `security.txt`, CAIQ Lite, SIG Core, owner sec assessment, 2026-Q2 SoW, audit matrix; SHA-256 ETag, 1h cache) |
| In-product support bundle (ZIP) | `archlucid support-bundle` | `POST /v1/admin/support-bundle` | `/admin/support` (Download support bundle button) | Execute (per owner decision F, item 37) | [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md) item **37(c) Resolved 2026-05-03** — shipped secret redaction + manual forward review; disclose tenant-identifying/contact PII to external support **only when** downloader (`ExecuteAuthority`) **explicitly intends** it |
| Architect opt-in tour | — | — | `/` (architect home — "Show me around" button) | Authenticated | [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md) item 38 (5 steps; assistant draft copy wrapped in pending-approval markers; never auto-launches per owner Q9) |
| Value report DOCX | — | value report generation | `/value-report` | Execute | [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md) |

---

## Cross-cutting CLI (not tied to one page)

| Action | CLI | Notes | Doc |
|--------|-----|-------|-----|
| New project scaffold | `… new <name>` | Creates client folder layout | [CLI_USAGE.md](CLI_USAGE.md) |
| Local dependencies | `… dev up` | SQL / Azurite / Redis profile | [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md) |
| Pilot stack | `… pilot up` | Demo-oriented compose | [FIRST_30_MINUTES.md](../engineering/FIRST_30_MINUTES.md) |
| One-shot try | `… try` | Seed + sample + open UI | [CLI_USAGE.md](CLI_USAGE.md#archlucid-try) |
| Comparisons library | `… comparisons …` | list / replay / drift | [COMPARISON_REPLAY.md](COMPARISON_REPLAY.md) |
| Support bundle | `… support-bundle …` | Sanitize before sharing | [README.md](../REPOSITORY_README.md) |
| Reference evidence ZIP | `… reference-evidence …` | tenant or admin | [go-to-market/reference-customers/README.md](../go-to-market/reference-customers/README.md) |

---

## Observability (Grafana + Prometheus)

| Action | CLI / script | Primary signal | Architect workspace | Runbook / doc |
|--------|--------------|----------------|-------------|---------------|
| Export readiness report | `python scripts/report_observability_export_readiness.py` | OTel export config | — | [OBSERVABILITY.md](OBSERVABILITY.md) |
| Real-mode LLM CI prereqs | `.\scripts\ci\verify_real_mode_prereqs.ps1` | GitHub vars/secrets names | — | [BUILD.md](../engineering/BUILD.md), [GOLDEN_COHORT_REAL_LLM_GATE.md](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) |
| Grafana dashboard import | — | Prometheus/Loki UIDs | — | [OBSERVABILITY_DASHBOARD_BINDING.md](../runbooks/OBSERVABILITY_DASHBOARD_BINDING.md) |
| Prometheus alert rules | `promtool check rules infra/prometheus/archlucid-alerts.yml` | `archlucid-agent-output-quality` | — | [TECH_BACKLOG.md](TECH_BACKLOG.md) Â§ TB-004 |

---

**Day-one role files** (`docs/onboarding/day-one-*.md`) stay for week-one checklists — use **this atlas** when you need the **canonical action map** (route Ã— API Ã— CLI) without narrative.
