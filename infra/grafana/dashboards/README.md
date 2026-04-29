# Grafana dashboards (as code)

JSON models in this folder (and committed siblings under **`../`**) are **imported** into:

- **Azure Managed Grafana** (`infra/terraform-monitoring` when `enable_managed_grafana = true` **and** **`grafana_terraform_dashboards_enabled`**), or  
- **Grafana Cloud** / self-hosted Grafana — use a **Prometheus** data source for metric JSON; use **Azure Monitor** for the container-apps template below.

After import, open each panel’s query editor and select your **subscription / resource group / Container App** for Azure Monitor-backed JSON; for **Prometheus** dashboards, bind template variable **`${datasource}`** to your Prometheus source.

| File | Purpose |
|------|---------|
| `archlucid-container-apps-overview.json` | Orientation: links + placeholder row for CPU/replica panels (Azure Monitor). |
| [`../dashboard-archlucid-authority.json`](../dashboard-archlucid-authority.json) | **Prometheus** — **`archlucid_authority_pipeline_stage_duration_ms`**, **`archlucid_authority_pipeline_work_pending`**, **`archlucid_authority_pipeline_work_oldest_pending_age_seconds`**, **`archlucid_data_consistency_*_total`** (see **`docs/library/OBSERVABILITY.md`**, remediation **`docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md`**). Import JSON workflow documented in-dashboard; optional Terraform **`grafana_dashboard` → `infra/terraform-monitoring/grafana_dashboards.tf`**. |
