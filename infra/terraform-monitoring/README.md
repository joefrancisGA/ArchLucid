# Terraform: monitoring & alerting (Azure Monitor + optional Managed Grafana)

Optional root for **monitoring-as-code**:

- **`azurerm_monitor_action_group`** — email + optional HTTPS webhook (common alert schema).
- **`azurerm_monitor_metric_alert`** — optional **CPU** alerts on **API** and/or **Worker** Container Apps (`CpuUsageNanoCores`, 5-minute window). Threshold is in **nano cores** (e.g. `500000000` ≈ **0.5 vCPU** average).
- **`azurerm_monitor_alert_prometheus_rule_group`** (optional) — when **`enable_prometheus_slo_rule_group = true`** and **`azure_monitor_workspace_id`** is set, provisions PromQL mirrored from **`../prometheus/archiforge-slo-rules.yml`** (HTTP **p99**, **5xx ratio**, **outbox depth**) and routes fires to the same **`azurerm_monitor_action_group`** as CPU alerts. Requires metrics in the workspace matching self-hosted scrape names (OTel HTTP semconv).
- **`azurerm_dashboard_grafana`** (optional) — **Azure Managed Grafana** 11.x; assign **Monitoring Reader** (or Log Analytics roles) to the instance **managed identity** so operators can build dashboards against subscription metrics.
- **Grafana Terraform provider** (optional) — when **`grafana_terraform_dashboards_enabled = true`**, provisions **`../grafana/*.json`** into a folder on that Managed Grafana (requires **`grafana_url`** + **`grafana_auth`**; usually a **second apply** after the workspace exists — see below).

Dashboard JSON intended for import (Grafana Cloud, Managed Grafana, or self-hosted) lives under **`../grafana/`** and **`../grafana/dashboards/`**.

## Defaults

- **`enable_monitoring_stack = false`** — no resources; `terraform validate` in CI stays green.
- **`enable_managed_grafana = false`** — avoids Grafana subscription quota/cost until you opt in.

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
