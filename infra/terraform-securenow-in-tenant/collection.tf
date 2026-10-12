resource "azurerm_automation_account" "collector" {
  name                = "${var.name_prefix}-aa"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  sku_name            = "Basic"
  tags                = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.collector.id]
  }
}

resource "azurerm_automation_runbook" "collector" {
  name                    = "${var.name_prefix}-collect"
  location                = var.location
  resource_group_name     = azurerm_resource_group.this.name
  automation_account_name = azurerm_automation_account.collector.name
  log_verbose             = true
  log_progress            = true
  description             = "Customer-owned collector. Publish the repo PowerShell 7 runbook over this stub before the schedule runs."
  runbook_type            = "PowerShell72"

  content = <<-EOT
    throw "Collector content is not published. Replace this stub with the customer-owned PowerShell 7 collector before the schedule runs."
  EOT

  tags = local.tags
}

resource "azurerm_automation_schedule" "collector" {
  name                    = "${var.name_prefix}-daily"
  resource_group_name     = azurerm_resource_group.this.name
  automation_account_name = azurerm_automation_account.collector.name
  frequency               = "Day"
  interval                = 1
  timezone                = "UTC"
  start_time              = var.collection_schedule_start_time
  description             = "Daily collection. Run now uses Automation Job Operator on this account."
}

resource "azurerm_automation_job_schedule" "collector" {
  resource_group_name     = azurerm_resource_group.this.name
  automation_account_name = azurerm_automation_account.collector.name
  schedule_name           = azurerm_automation_schedule.collector.name
  runbook_name            = azurerm_automation_runbook.collector.name
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = "${var.name_prefix}-logs"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

resource "azurerm_monitor_diagnostic_setting" "automation" {
  name                       = "${var.name_prefix}-aa-diag"
  target_resource_id         = azurerm_automation_account.collector.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id

  enabled_log {
    category = "JobLogs"
  }

  enabled_log {
    category = "JobStreams"
  }
}
