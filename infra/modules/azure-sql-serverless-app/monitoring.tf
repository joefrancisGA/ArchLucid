resource "azurerm_monitor_diagnostic_setting" "sql_db" {
  count = var.enable_sql_monitoring && var.log_analytics_workspace_id != null ? 1 : 0

  name                       = "sql-diagnostics"
  target_resource_id         = azurerm_mssql_database.app.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "SQLInsights"
  }

  enabled_log {
    category = "AutomaticTuning"
  }

  enabled_log {
    category = "QueryStoreRuntimeStatistics"
  }

  enabled_log {
    category = "Errors"
  }

  enabled_log {
    category = "Deadlocks"
  }

  metric {
    category = "Basic"
    enabled  = true
  }

  metric {
    category = "InstanceAndAppAdvanced"
    enabled  = true
  }
}

resource "azurerm_monitor_metric_alert" "sql_cpu" {
  count = var.enable_sql_monitoring && var.monitor_action_group_id != null ? 1 : 0

  name                = "${var.sql_database_name}-cpu-high"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_mssql_database.app.id]
  severity            = 2
  description         = "Azure SQL CPU above 80% for 5 minutes."

  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  frequency   = "PT1M"
  window_size = "PT5M"

  action {
    action_group_id = var.monitor_action_group_id
  }
}

resource "azurerm_monitor_metric_alert" "sql_connections" {
  count = var.enable_sql_monitoring && var.monitor_action_group_id != null ? 1 : 0

  name                = "${var.sql_database_name}-connection-failures"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_mssql_database.app.id]
  severity            = 1
  description         = "Azure SQL connection failures above 5 per minute."

  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "connection_failed"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 5
  }

  frequency   = "PT1M"
  window_size = "PT1M"

  action {
    action_group_id = var.monitor_action_group_id
  }
}

resource "azurerm_monitor_metric_alert" "sql_deadlocks" {
  count = var.enable_sql_monitoring && var.monitor_action_group_id != null ? 1 : 0

  name                = "${var.sql_database_name}-deadlocks"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_mssql_database.app.id]
  severity            = 2
  description         = "Azure SQL deadlocks detected."

  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "deadlock"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 0
  }

  frequency   = "PT1M"
  window_size = "PT5M"

  action {
    action_group_id = var.monitor_action_group_id
  }
}