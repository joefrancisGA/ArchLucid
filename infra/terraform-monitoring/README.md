# Terraform: monitoring & alerting (Azure Monitor + optional Managed Grafana)

Optional root for **monitoring-as-code**:

- **`azurerm_monitor_action_group`** â€” email + optional HTTPS webhook (common alert schema).
- **`azurerm_monitor_metric_alert`** â€” optional **CPU** alerts on **API** and/or **Worker** Container Apps (`CpuUsageNanoCores`, 5-minute window). Threshold is in **nano cores** (e.g. `500000000` â‰ˆ **0.5 vCPU** average).
- **`azurerm_monitor_alert_prometheus_rule_group`** (optional) â€” when **`enable_prometheus_slo_rule_group = true`** and **`azure_monitor_workspace_id`** is set, provisions PromQL mirrored from **`../prometheus/archlucid-slo-rules.yml`** (HTTP **p99**, **5xx ratio**, **outbox depth**), plus **`ArchLucidIntegrationOutboxDeadLetterNonZeroTf`** (dead-letter gauge from **`archlucid-alerts.yml`**), and routes fires to the same **`azurerm_monitor_action_group`** as CPU alerts. Requires metrics in the workspace matching self-hosted scrape names (OTel HTTP semconv).
- **`azurerm_dashboard_grafana`** (optional) â€” **Azure Managed Grafana** 11.x; assign **Monitoring Reader** (or Log Analytics roles) to the instance **managed identity** so operators can build dashboards against subscription metrics.
- **Grafana Terraform provider** (optional) â€” when **`grafana_terraform_dashboards_enabled = true`**, provisions **`../grafana/*.json`** into a folder on that Managed Grafana (requires **`grafana_url`** + **`grafana_auth`**; usually a **second apply** after the workspace exists â€” see below).

Dashboard JSON intended for import (Grafana Cloud, Managed Grafana, or self-hosted) lives under **`../grafana/`** and **`../grafana/dashboards/`**. Prometheus-oriented bundles (**`dashboard-archlucid-authority.json`**, SLO/trial funnel/LLM) pair with **`../prometheus/archlucid-alerts.yml`** alert names (including **`archlucid-agent-output-quality`** for agent-output metrics); **`docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md`** ties authority panels to remediation. **Agent-output PromQL** is documented in **`docs/library/OBSERVABILITY.md`**.


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

- **`enable_monitoring_stack = false`** â€” no resources; `terraform validate` in CI stays green.
- **`enable_managed_grafana = false`** â€” avoids Grafana subscription quota/cost until you opt in.

## Wiring after `terraform-container-apps`

1. Apply **`infra/terraform-container-apps`** (or note Container App **resource IDs** from Azure Portal).
2. Set **`api_container_app_resource_id`** / **`worker_container_app_resource_id`** and a non-zero **`container_cpu_nanos_threshold`** to create CPU alerts.
3. Run `terraform plan` / `apply` in this directory.

### Provisioning dashboards with Terraform (optional)

1. Apply with **`enable_managed_grafana = true`** and **`grafana_terraform_dashboards_enabled = false`** first.
2. Read output **`grafana_endpoint`**, open Grafana, create a **service account + token** with dashboard edit rights.
3. Set **`grafana_url`** to that endpoint (include `https://`) and **`grafana_auth`** to the token (use **`TF_VAR_grafana_auth`** in CI/CD), then set **`grafana_terraform_dashboards_enabled = true`** and apply again.

`terraform validate` in CI keeps **`grafana_terraform_dashboards_enabled`** false so checks do not require a real token.

## Commands

```bash
cd infra/terraform-monitoring
terraform init
cp terraform.tfvars.example terraform.tfvars   # edit
terraform plan
terraform apply
```

## Security & cost

- **Webhook URLs** are sensitive; pass via **`TF_VAR_alert_webhook_uri`** or a pipeline secret, not git.
- **Managed Grafana** is a separate billed resource; tighten **public network access** and use **private endpoints** in hardened environments (extend `main.tf` as needed).

