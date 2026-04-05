locals {
  grafana_dashboards_enabled = var.enable_managed_grafana && var.grafana_terraform_dashboards_enabled
}

resource "grafana_folder" "archiforge" {
  count = local.grafana_dashboards_enabled ? 1 : 0

  title = "ArchiForge"

  depends_on = [azurerm_dashboard_grafana.archiforge]
}

resource "grafana_dashboard" "slo" {
  count = local.grafana_dashboards_enabled ? 1 : 0

  folder      = grafana_folder.archiforge[0].id
  config_json = file("${path.module}/../grafana/dashboard-archiforge-slo.json")
}

resource "grafana_dashboard" "llm_usage" {
  count = local.grafana_dashboards_enabled ? 1 : 0

  folder      = grafana_folder.archiforge[0].id
  config_json = file("${path.module}/../grafana/dashboard-archiforge-llm-usage.json")
}

resource "grafana_dashboard" "authority" {
  count = local.grafana_dashboards_enabled ? 1 : 0

  folder      = grafana_folder.archiforge[0].id
  config_json = file("${path.module}/../grafana/dashboard-archiforge-authority.json")
}

resource "grafana_dashboard" "container_apps_overview" {
  count = local.grafana_dashboards_enabled ? 1 : 0

  folder      = grafana_folder.archiforge[0].id
  config_json = file("${path.module}/../grafana/dashboards/archiforge-container-apps-overview.json")
}
