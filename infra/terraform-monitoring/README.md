# Terraform: monitoring & alerting (Azure Monitor + optional Managed Grafana)

Optional root for **monitoring-as-code**:

- **`azurerm_monitor_action_group`** — email + optional HTTPS webhook (common alert schema).
- **`azurerm_monitor_metric_alert`** — optional **CPU** alerts on **API** and/or **Worker** Container Apps (`CpuUsageNanoCores`, 5-minute window). Threshold is in **nano cores** (e.g. `500000000` â‰ˆ **0.5 vCPU** average). **TB-731** adds optional **UI** Container App **CPU** (`CpuPercentage`, 15m) and **replica saturation** (`Replicas`, 15m) alerts when **`ui_container_app_resource_id`** is set.
- **TB-909** — optional **`azurerm_cost_anomaly_alert`** + **`azurerm_consumption_budget_subscription`** rollup when **`enable_subscription_cost_management = true`** (default). Rollup amount = **`sum(subscription_cost_rollup_budget_components) * subscription_rollup_budget_headroom_multiplier`** (default **1.2**); notifications at **50/75/90% actual** and **100% forecasted**. Not gated by **TB-903** posture tier.
- **`azurerm_monitor_alert_prometheus_rule_group`** (optional) — when **`enable_prometheus_slo_rule_group = true`** and **`azure_monitor_workspace_id`** is set, provisions PromQL mirrored from **`../prometheus/archlucid-slo-rules.yml`** (HTTP **p99**, **5xx ratio**, **outbox depth**), plus **`ArchLucidIntegrationOutboxDeadLetterNonZeroTf`** (dead-letter gauge from **`archlucid-alerts.yml`**), **TB-731** signup funnel volume alerts on **`archlucid_first_tenant_funnel_events_total{event="signup"}`**, and routes fires to the same **`azurerm_monitor_action_group`** as CPU alerts. Requires metrics in the workspace matching self-hosted scrape names (OTel HTTP semconv).
- **`azurerm_dashboard_grafana`** (optional) — **Azure Managed Grafana** 11.x; assign **Monitoring Reader** (or Log Analytics roles) to the instance **managed identity** so operators can build dashboards against subscription metrics.
- **Grafana Terraform provider** (optional) — when **`grafana_terraform_dashboards_enabled = true`**, provisions **`../grafana/*.json`** into a folder on that Managed Grafana (requires **`grafana_url`** + **`grafana_auth`**; usually a **second apply** after the workspace exists — see below).

Dashboard JSON intended for import (Grafana Cloud, Managed Grafana, or self-hosted) lives under **`../grafana/`** and **`../grafana/dashboards/`**. Prometheus-oriented bundles (**`dashboard-archlucid-authority.json`**, SLO/trial funnel/LLM) pair with **`../prometheus/archlucid-alerts.yml`** alert names (including **`archlucid-agent-output-quality`** for agent-output metrics); **`docs/library/OBSERVABILITY.md`** (§ Authority pipeline remediation runbook) ties authority panels to remediation. **Agent-output PromQL** is documented in **`docs/library/OBSERVABILITY.md`**.


## Two-tier alert routing (Improvement #46)

When **`enable_critical_action_group = true`**, Terraform creates a second action group (**`*-critical-ag`**) with:

- **Email** (same ops address as the default group)
- **SMS** + **voice** (Azure Monitor native; configure country codes in tfvars, phone numbers in Key Vault)
- **PagerDuty Events API v2** webhook (escalating push → SMS → phone until acknowledged)

P0 Prometheus rules ( **`../prometheus/archlucid-alerts.yml`** labels **`tier: p0`** ) route to **`azurerm_monitor_action_group.critical`** via **`prometheus_p0_rules.tf`** when **`enable_prometheus_slo_rule_group`** and **`azure_monitor_workspace_id`** are set. All other alerts continue to use the email-only **`ops`** action group.

### Key Vault secrets (production)

```bash
az keyvault secret set --vault-name <kv-name> --name alert-sms-phone-number --value "2025550100"
az keyvault secret set --vault-name <kv-name> --name alert-voice-phone-number --value "2025550100"
az keyvault secret set --vault-name <kv-name> --name alert-pagerduty-webhook-uri --value "https://events.pagerduty.com/integration/{key}/enqueue"
```

Set **`read_alert_secrets_from_key_vault = true`** and point **`alert_secrets_key_vault_*`** at your vault. See **`production.tfvars.example`**.

## Defaults

- **`enable_monitoring_stack = true`** (2026-07-20) — on its own this creates exactly one free `azurerm_monitor_action_group`; CPU metric alerts stay off unless you also set `container_cpu_percent_threshold > 0` and a resource ID. `checks.tf` fails `plan` fast (before any resource is created) if `alert_email_address` is empty, so CI's bare `terraform validate` (no tfvars, no `-var-file`) still stays green — `check` blocks are evaluated at `plan`/`apply`, not `validate`. Set `false` for a throwaway sandbox with no ops email.
- **`enable_managed_grafana = false`** — avoids Grafana subscription quota/cost until you opt in.

## Wiring after `terraform-container-apps`

1. Apply **`infra/terraform-container-apps`** (or note Container App **resource IDs** from Azure Portal).
2. Set **`api_container_app_resource_id`** / **`worker_container_app_resource_id`** and a non-zero **`container_cpu_percent_threshold`** to create CPU alerts.
3. **TB-731:** set **`ui_container_app_resource_id`** for UI traffic-pressure alerts; tune **`ui_container_cpu_percent_threshold`** / **`ui_replica_saturation_threshold`**; enable **`enable_prometheus_slo_rule_group`** for signup-volume PromQL alerts; optionally **`enable_first_tenant_funnel_workbook = true`** for the first-tenant funnel workbook. Thresholds are documented in **`docs/library/MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md`** §6.
4. **TB-909:** set **`subscription_cost_rollup_budget_time_period_start`** and **`subscription_cost_rollup_budget_contact_emails`** (or rely on **`alert_email_address`**). Mirror per-root amounts in **`subscription_cost_rollup_budget_components`** from **`terraform-container-apps`**, **`terraform-sql-failover`**, and **`terraform-openai`** production examples.
5. Run `terraform plan` / `apply` in this directory.

### Provisioning dashboards with Terraform (optional)

1. Apply with **`enable_managed_grafana = true`** and **`grafana_terraform_dashboards_enabled = false`** first.
2. Read output **`grafana_endpoint`**, open Grafana, create a **service account + token** with dashboard edit rights.
3. Set **`grafana_url`** to that endpoint (include `https://`) and **`grafana_auth`** to the token (use **`TF_VAR_grafana_auth`** in CI/CD), then set **`grafana_terraform_dashboards_enabled = true`** and apply again.

`terraform validate` in CI keeps **`grafana_terraform_dashboards_enabled`** false so checks do not require a real token.

## Commands

```bash
cd infra/terraform-monitoring
terraform init -backend-config=backend.dev.hcl.example   # or copy to backend.dev.hcl (gitignored)
cp terraform.tfvars.example terraform.tfvars   # edit
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

### Remote state (dev)

Copy **`backend.dev.hcl.example`** to **`backend.dev.hcl`** (gitignored) or pass it to **`terraform init -backend-config=...`**. State key **`monitoring.tfstate`** in storage account **`starchlucidtfdev001`** / container **`tfstate`**.

Migrate local state once:

```bash
terraform init -backend-config=backend.dev.hcl.example -migrate-state -reconfigure
```

### OpenTelemetry → Azure Monitor workspace

When **`enable_application_insights`**, **`enable_container_app_environment_otel`**, and **`wire_container_app_observability_env`** are true:

1. Creates workspace-linked **Application Insights** (connection string for in-process Azure Monitor exporters).
2. Patches the **Container Apps Environment** OpenTelemetry agent (AzAPI) to route traces/logs to App Insights and metrics to the AMW default DCE OTLP endpoint.
3. Sets **`APPLICATIONINSIGHTS_CONNECTION_STRING`** on API and worker via **`scripts/ops/wire-application-insights-env.ps1`** after apply (brownfield Container Apps cannot be safely merged with AzAPI without invalidating Key Vault secret refs).

P0 **`archlucid_*` PromQL** rules require those metrics in the AMW; verify scrape/export after apply with the **`azure_monitor_prometheus_query_endpoint`** output.

**Solo-operator MVO (TB-957):** founder P0 checklist, honesty boundaries, and Portal Test drill — [`docs/operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../../docs/operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md). Prefer the scripted verify below over ad-hoc queries.

### Verify metrics reached AMW

```powershell
# From repo root (preferred — TB-957):
pwsh ./scripts/ops/verify-amw-p0-metrics.ps1

# Or manual (same endpoint):
$q = terraform output -raw azure_monitor_prometheus_query_endpoint
$token = az account get-access-token --resource https://prometheus.monitor.azure.com --query accessToken -o tsv
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "$q/api/v1/query?query=archlucid_circuit_breaker_state" -Headers $headers
```

Expect non-empty `data.result` once API/worker `/metrics` export reaches the workspace (may take several minutes after revision restart). If empty while CAE `openTelemetryConfiguration` is set, confirm apps have **`APPLICATIONINSIGHTS_CONNECTION_STRING`** (`scripts/ops/wire-application-insights-env.ps1`) and open an Azure support path for DCE→AMW DCR association.

PagerDuty webhook: set Key Vault secret **`alert-pagerduty-webhook-uri`**, then **`read_alert_pagerduty_secret_from_key_vault = true`** in tfvars.

## Security & cost

- **Webhook URLs** are sensitive; pass via **`TF_VAR_alert_webhook_uri`** or a pipeline secret, not git.
- **Managed Grafana** is a separate billed resource; tighten **public network access** and use **private endpoints** in hardened environments (extend `main.tf` as needed).

