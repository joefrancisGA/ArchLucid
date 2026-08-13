# Solo-operator MVO observability (P0 page path)

**Audience:** Founder / solo operator of a multi-tenant ArchLucid deployment  
**Backlog:** [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) **TB-957** (enablement) · **TB-958** / **TB-959** (**Done** — owner enablement checklists below)  
**GTM:** [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **M-119** (claim honesty) · **M-120** (founder drill cadence)  
**IaC:** [`infra/terraform-monitoring`](../../infra/terraform-monitoring/README.md) · P0 rules in `prometheus_p0_rules.tf`

## What “in place” means

Repo YAML and Terraform are **not** an enabled paging path. For a solo operator, MVO means all three:

1. **Applied scrape** — `archlucid_*` (and API `up`) series visible in the Azure Monitor workspace (AMW).
2. **Critical action group** — email / SMS / voice / PagerDuty (as configured) on `azurerm_monitor_action_group.critical`.
3. **Known P0 set** — a short list of rules that must page the founder; warn-tier noise stays out of MVO.

Do **not** claim a second SRE platform or 24×7 NOC. Do **not** promise that every alert in `archlucid-alerts.yml` pages.

## MVO P0 catalog (≤8)

These seven rules ship in Terraform when `enable_prometheus_slo_rule_group` / P0 group flags and AMW are enabled. All route to the **critical** action group. The review-path canary (**TB-959**) pages via PagerDuty/webhook from GitHub Actions (not a PromQL rule).

| Alert (Terraform) | Signal (customer language) | PromQL gist | Typical runbook |
|-------------------|----------------------------|-------------|-----------------|
| `ArchLucidApiUnavailableTf` | API unreachable | `absent(up{job="archlucid-api"})` or no healthy instances | [`PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md), Container Apps revision / Front Door |
| `ArchLucidHealthCheckUnhealthyTf` | Ready probe Unhealthy | `archlucid_health_check_status{status="Unhealthy"} > 0` | [`HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md`](HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md) |
| `ArchLucidSqlConnectionFailuresSustainedTf` | SQL connect failures | `archlucid_sql_connection_failures_total > 0` | SQL firewall / MI / connection string; [`DATABASE_FAILOVER.md`](../runbooks/DATABASE_FAILOVER.md) if geo |
| `ArchLucidCircuitBreakerOpenTf` | OpenAI circuit open | `archlucid_circuit_breaker_state > 0` | [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](../library/LLM_RETRY_AND_CIRCUIT_BREAKER.md) |
| `ArchLucidAuthorityPipelineWorkDeadLettersTf` | Authority outbox dead letters | `archlucid_authority_pipeline_work_dead_letter > 0` | [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) authority remediation |
| `ArchLucidTrialSignupFailuresHighTf` | Trial signup failure rate | sustained signup failures | [`TRIAL_FUNNEL.md`](../runbooks/TRIAL_FUNNEL.md) |
| `ArchLucidStaleInFlightRunsTf` | Runs stuck mid-lifecycle (&gt;1h) | `archlucid_runs_stale_in_flight_count > 0` (15m) | [`STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md) |

Warn / SLO / agent-output groups that target the **ops** (email-only) action group are **out of MVO**. Expand MVO only when a new rule is severity-0 and wired to **critical**.

## Enablement checklist (staging → production)

Record environment, date, and operator initials in your private run notes (not required in git).

### A. Terraform / secrets

- [ ] `enable_monitoring_stack = true`
- [ ] `alert_email_address` set (founder mailbox)
- [ ] `enable_critical_action_group = true`
- [ ] `enable_prometheus_slo_rule_group = true` (or equivalent flag that enables `prometheus_p0_rules.tf`)
- [ ] `azure_monitor_workspace_id` (or workspace created in-root) applied
- [ ] Key Vault phones / PagerDuty webhook present when SMS/voice/PD are required (`read_alert_secrets_from_key_vault`)
- [ ] OTel → AMW path applied (`enable_container_app_environment_otel` + `wire-application-insights-env.ps1` as documented)

### B. Scrape proof

- [ ] From `infra/terraform-monitoring`, run:

```powershell
pwsh ../../scripts/ops/verify-amw-p0-metrics.ps1
```

- [ ] Expect non-empty results for at least one `archlucid_*` series (empty ⇒ fix export before trusting alerts).

### C. Page-path proof (owner — GTM **M-120**)

- [ ] Azure Portal → Monitor → Alerts → pick one MVO P0 rule → **Test** (or controlled inject).
- [ ] Confirm founder channel(s) fire within the intended latency.
- [ ] Repeat once per release cut for the target environment (staging before prod).
- [ ] Log pass/fail for **M-120** (private notes or FOUNDER routine appendix).

### D. Release gate

- [ ] [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) §3 — **MVO page path verified this environment**.

## Honesty boundaries

| Do promise | Do not promise |
|------------|----------------|
| A documented P0 set and how to enable paging | That YAML in git means production pages today |
| Founder can verify AMW + action-group Test | Full multi-on-call SRE tooling |
| Auth/showcase synthetics exist (**TB-758** / **TB-889**) | That auth/showcase alone prove the review journey |
| Fleet P0s catch platform-wide failures | Unbounded per-tenant Prom series for every stuck run |
| Cardinality-safe stale-run P0 (**TB-958** **Done**) with tenant/run in **logs** | Instant page the second a run crosses 1h (15m `for` dampens flaps) |
| Create→execute→commit canary that can page (**TB-959** **Done**) when enabled | That the canary is on until `ARCHLUCID_REVIEW_PATH_CANARY_ENABLED=true` + paging secret |
| Report Problem routes to support inbox by design (**TB-788**) | That every tenant failure pages the founder before a customer ticket |

### Owner enablement (TB-958 / TB-959 engineering **Done**)

- [ ] Terraform apply includes `ArchLucidStaleInFlightRunsTf` (requires AMW scrape of `archlucid_runs_stale_in_flight_count`) — see [`STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md)
- [ ] `ARCHLUCID_REVIEW_PATH_CANARY_ENABLED=true` + smoke API key; one green `workflow_dispatch` — see [`REVIEW_PATH_CANARY.md`](../runbooks/REVIEW_PATH_CANARY.md)
- [ ] `ARCHLUCID_PAGERDUTY_ROUTING_KEY` (preferred) or critical webhook secret set for canary failures

## Related

- Pages vs support-email decision matrix: [`SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md`](SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md) (**TB-989**)
- Metrics catalog: [`OBSERVABILITY.md`](../library/OBSERVABILITY.md)
- Self-hosted alert YAML: `infra/prometheus/archlucid-alerts.yml` (`tier: p0`)
- SLO / Grafana: [`SLO_PROMETHEUS_GRAFANA.md`](../runbooks/SLO_PROMETHEUS_GRAFANA.md)
- Founder UI acceptance (product lane): [`FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md) — ops page-path drill is **M-120**, linked from that doc’s ops note

## Verification (TB-991)

CI guard: `scripts/ci/check_solo_ops_mvo_honesty.py` — retains honesty anchors in this doc, forbids over-strong paging copy, and asserts P0 Terraform rules route to `azurerm_monitor_action_group.critical` (not `ops`).
