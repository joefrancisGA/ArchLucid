> **Scope:** Runbooks index - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Runbooks index

**Last reviewed:** 2026-06-06

Operational guides for ArchLucid operators. Each runbook is self-contained; cross-links point to deeper design docs where useful.

**Former doc paths:** [`../redirects.md`](../redirects.md) — canonical map when a bookmark or link 404s after the documentation audit (no redirect stub files in-tree).

**Persona entry (first pilot / release):** [`ROLE_INDEX.md`](./ROLE_INDEX.md) — maps operator, platform engineer, and release owner paths without duplicating procedures.

**Availability policy:** [RTO / RPO targets by tier](../library/RTO_RPO_TARGETS.md) — development vs staging vs production (SQL geo-replication, RPO/RTO examples).

## Priority tags (convention)

| Tag | Meaning |
|-----|---------|
| **P1 — Critical** | Production incident, data integrity, **security rotation**, or **DR / failover** paths that must be executable under pressure. |
| **P2 — Important** | Recurring triage, degraded features, data hygiene, or observability workflows that restore normal operations. |
| **P3 — Reference** | Drills, load-test quirks, developer-oriented infra, or **deferred** one-off procedures (still version-controlled). |

Tags are **guidance for paging and training**; they do not replace your org’s own severity scale.

| Priority | Runbook | When to use |
|----------|---------|-------------|
| **P1** | [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | **Hosted staging + production** — pre-deploy gates, validation, promotion, canary traffic split. Rollback: [`DEPLOYMENT_RUNBOOK.md`](../library/DEPLOYMENT_RUNBOOK.md). |
| **P1** | [FIRST_PILOT_OPERATOR_PATH.md](./FIRST_PILOT_OPERATOR_PATH.md) | **Single V1 pilot path** — storage/auth → evidence → create → commit → sponsor export → next action (no V1.1 connectors required). |
| **P1** | [DATABASE_FAILOVER.md](./DATABASE_FAILOVER.md) | Azure SQL HA / geo-failover, listeners, RPO/RTO, post-failover checks. |
| **P1** | [SECRET_AND_CERT_ROTATION.md](./SECRET_AND_CERT_ROTATION.md) | Keys, SQL passwords, JWT, webhooks, TLS. |
| **P1** | [API_KEY_ROTATION.md](./API_KEY_ROTATION.md) | API key lifecycle for automation principals and smoke probes. |
| **P1** | [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) | DbUp / SQL migration issues and rollback posture. |
| **P1** | [TRACE_A_RUN.md](./TRACE_A_RUN.md) | Reconstruct one run across audit (`CorrelationId` / `RunId`), traces (`otelTraceId`), and logs. |
| **P2** | [PILOT_RESCUE_PLAYBOOK.md](./PILOT_RESCUE_PLAYBOOK.md) | **V1** symptom-first triage during Core Pilot (`doctor` + `support-bundle` **`references.json`** point here). |
| **P2** | [AGENT_EXECUTION_FAILURES.md](./AGENT_EXECUTION_FAILURES.md) | Architecture run execute fails (simulator vs real agents, traces, schema). |
| **P2** | [ALERT_DELIVERY_FAILURES.md](./ALERT_DELIVERY_FAILURES.md) | Alert routing subscriptions fire but destinations do not receive notifications. |
| **P2** | [ADVISORY_SCAN_FAILURES.md](./ADVISORY_SCAN_FAILURES.md) | Advisory scans fail or schedules do not fire. |
| **P2** | [COMPARISON_REPLAY_RATE_LIMITS.md](./COMPARISON_REPLAY_RATE_LIMITS.md) | Replay throttling, 429s, or batch replay partial failures. |
| **P2** | [RATE_LIMIT_EXCEEDED.md](./RATE_LIMIT_EXCEEDED.md) | **429** on **`POST …/evidence/bulk`** (`evidenceBulkUpload` policy): identify tenant, inspect limits, tune config. |
| **P2** | [SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md](./SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md) | Rotate **`ArchLucidAuth:Saml2`** SP signing PFX without SSO downtime; detection, OpenSSL, IdP overlap, rollback (`archlucid saml test-config`). Alias: [SAML_CERT_ROTATION.md](./SAML_CERT_ROTATION.md). |
| **P2** | [SCIM_TOKEN_ROTATION.md](./SCIM_TOKEN_ROTATION.md) | Rotate inbound SCIM bearer tokens per tenant; update Entra/Okta provisioning apps without sync breakage. |
| **P2** | [COMPARISON_RECORD_ORPHAN_REMEDIATION.md](./COMPARISON_RECORD_ORPHAN_REMEDIATION.md) | Orphan `ComparisonRecords` / golden manifests / findings snapshots vs `dbo.Runs` (dry-run then delete). |
| **P2** | [DATA_CONSISTENCY_ENFORCEMENT.md](./DATA_CONSISTENCY_ENFORCEMENT.md) | Orphan probe **Warn / Alert / Quarantine** modes, Prometheus counters, quarantine (**insert-only** staging). |
| **P2** | [DATA_ARCHIVAL_HEALTH.md](./DATA_ARCHIVAL_HEALTH.md) | `data_archival` health degraded or archival host errors. |
| **P2** | [PROVENANCE_INDEXING.md](./PROVENANCE_INDEXING.md) | Provenance indexing lag or failures. |
| **P2** | [../library/OBSERVABILITY.md](../library/OBSERVABILITY.md#authority-pipeline-remediation-runbook) | Grafana / Prometheus: authority outbox backlog, stale rows, data-consistency counters vs alerts; scale and SQL triage. |
| **P2** | [../library/SCALE_THRESHOLD_RUNBOOK.md](../library/SCALE_THRESHOLD_RUNBOOK.md) | When to enable Redis, read replicas, worker split, outbox scaling, and query p95 triage for hosted SaaS. |
| **P2** | [BILLING_WEBHOOK_REPLAY_GUARD.md](./BILLING_WEBHOOK_REPLAY_GUARD.md) | Stripe/Marketplace webhook replay vs signature verification, SQL ledger investigation, safe resend. |
| **P2** | [INTEGRATION_EVENT_DLQ_RETRY_POLICY.md](./INTEGRATION_EVENT_DLQ_RETRY_POLICY.md) | Outbox dead-letter auto-retry cadence, permanent failure, manual retry/suppress. |
| **P2** | [OBSERVABILITY_DASHBOARD_BINDING.md](./OBSERVABILITY_DASHBOARD_BINDING.md) | Import/provision Grafana JSON; datasource UIDs; RAG per-tenant tag cardinality. |
| **P2** | [SLO_PROMETHEUS_GRAFANA.md](./SLO_PROMETHEUS_GRAFANA.md) | Metrics, SLOs, Grafana panels. |
| **P2** | [INFRASTRUCTURE_OPS.md](./INFRASTRUCTURE_OPS.md) | Terraform stacks (APIM, Front Door, Entra, private endpoints): validate, roll out, triage. |
| **P2** | [AZURE_MARKETPLACE_SAAS_OFFER.md](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#marketplace-ga-rollback-changeplan--changequantity) | Roll Marketplace `ChangePlan` / `ChangeQuantity` to `AcknowledgedNoOp` (`Billing:AzureMarketplace:GaEnabled=false`). |
| **P2** | [LLM_PROMPT_REDACTION.md](./LLM_PROMPT_REDACTION.md) | **`LlmPromptRedaction`** toggles, metrics (`archlucid_llm_prompt_redactions_total`), and forensics alignment with **`AgentExecutionTraceRecorder`**. |
| **P3** | [GEO_FAILOVER_DRILL.md](./GEO_FAILOVER_DRILL.md) | **Scheduled drill:** measure RTO/RPO, record T0–T3, smoke after cutover. |
| **P3** | [LOAD_TEST_RATE_LIMITS.md](./LOAD_TEST_RATE_LIMITS.md) | Load testing against rate-limited endpoints. |
| **P3** | [REDIS_HEALTH.md](./REDIS_HEALTH.md) | Redis used for dev compose / cache patterns; connectivity and health checks. |
| **P3** | [LOGIC_APPS_STANDARD.md](./LOGIC_APPS_STANDARD.md) | Optional Logic App (Standard) hosts for Service Bus integration workflows (ADR 0019). |
| **P3** | [TERRAFORM_STATE_MV_PHASE_7_5.md](./TERRAFORM_STATE_MV_PHASE_7_5.md) | **Stub** — greenfield IaC complete; brownfield **state mv** archive: [`../archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`](../archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md). First deploy: [`../FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md). |
| **P3** | [COPILOT_CODE_REVIEW_SETUP.md](./COPILOT_CODE_REVIEW_SETUP.md) | One-time setup: enable GitHub Copilot auto-review on every PR; lives alongside `.github/copilot-instructions.md` + `CODEOWNERS`. |
| **P3** | [PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md](./PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md) | **Market validation** — five-step bakeoff: manual frontier AI, ArchLucid, blind compare, decision-delta, sponsor-safe summary. |

**Related:** `infra/README.md` (Terraform roots and feature flags), `docs/CONTAINERIZATION.md` (Dockerfile and compose profiles).
