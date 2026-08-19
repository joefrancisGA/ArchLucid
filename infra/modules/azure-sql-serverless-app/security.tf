# SQL platform auditing and Microsoft Defender for SQL (Improvement #47).

locals {
  sql_auditing_enabled = length(trimspace(coalesce(var.log_analytics_workspace_id, ""))) > 0

  sql_defender_enabled = var.enable_sql_defender

  vuln_scan_storage_account_name = length(trimspace(var.vuln_scan_storage_account_name)) > 0 ? trimspace(var.vuln_scan_storage_account_name) : substr(replace(lower(var.sql_server_name), "-", ""), 0, min(18, length(replace(lower(var.sql_server_name), "-", "")))) + "vscan"
}

resource "azurerm_mssql_server_extended_auditing_policy" "primary" {
  count = local.sql_auditing_enabled ? 1 : 0

  server_id              = azurerm_mssql_server.primary.id
  enabled                = true
  log_monitoring_enabled = true
  retention_in_days      = var.sql_audit_retention_days
}

resource "azurerm_monitor_diagnostic_setting" "sql_server_audit" {
  count = local.sql_auditing_enabled ? 1 : 0

  name                       = "sql-server-audit"
  target_resource_id         = azurerm_mssql_server.primary.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "SQLSecurityAuditEvents"
  }
}

resource "azurerm_mssql_server_security_alert_policy" "primary" {
  count = local.sql_defender_enabled ? 1 : 0

  resource_group_name  = var.resource_group_name
  server_name          = azurerm_mssql_server.primary.name
  state                = "Enabled"
  email_account_admins = true
  email_addresses      = [var.alert_email_address]
  disabled_alerts      = []
  retention_days       = 90
}

resource "azurerm_storage_account" "vuln_scan" {
  count = local.sql_defender_enabled ? 1 : 0

  name                     = local.vuln_scan_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
}

resource "azurerm_storage_container" "vuln_scan" {
  count = local.sql_defender_enabled ? 1 : 0

  name                  = "vulnerability-assessment"
  storage_account_name  = azurerm_storage_account.vuln_scan[0].name
  container_access_type = "private"
}

resource "azurerm_mssql_server_vulnerability_assessment" "primary" {
  count = local.sql_defender_enabled ? 1 : 0

  server_security_alert_policy_id = azurerm_mssql_server_security_alert_policy.primary[0].id
  storage_container_path          = "${azurerm_storage_account.vuln_scan[0].primary_blob_endpoint}${azurerm_storage_container.vuln_scan[0].name}/"
  storage_account_access_key      = azurerm_storage_account.vuln_scan[0].primary_access_key

  recurring_scans {
    enabled                   = true
    email_subscription_admins = true
    emails                    = [var.alert_email_address]
  }
}
