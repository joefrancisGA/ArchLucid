locals {
  enabled = var.enable_idle_deallocate

  target_vm_resource_group_name = trimspace(var.target_vm_resource_group_name)
  target_vm_name                = trimspace(var.target_vm_name)

  automation_resource_group_name = local.enabled ? (
    var.create_automation_resource_group ? azurerm_resource_group.ops[0].name : data.azurerm_resource_group.ops[0].name
  ) : ""

  automation_location = local.enabled ? (
    var.create_automation_resource_group ? var.location : data.azurerm_resource_group.ops[0].location
  ) : ""

  protected_process_names_csv = join(",", var.protected_process_names)
  schedule_start_time         = timeadd(timestamp(), "20m")
}

check "target_vm_required_when_enabled" {
  assert {
    condition = !local.enabled || (
      length(local.target_vm_resource_group_name) > 0 && length(local.target_vm_name) > 0
    )
    error_message = "When enable_idle_deallocate is true, set target_vm_resource_group_name and target_vm_name."
  }
}

data "azurerm_resource_group" "ops" {
  count = local.enabled && !var.create_automation_resource_group ? 1 : 0
  name  = var.automation_resource_group_name
}

data "azurerm_virtual_machine" "target" {
  count               = local.enabled ? 1 : 0
  name                = local.target_vm_name
  resource_group_name = local.target_vm_resource_group_name
}

resource "azurerm_resource_group" "ops" {
  count = local.enabled && var.create_automation_resource_group ? 1 : 0

  name     = var.automation_resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_automation_account" "idle" {
  count = local.enabled ? 1 : 0

  name                = var.automation_account_name
  location            = local.automation_location
  resource_group_name = local.automation_resource_group_name
  sku_name            = "Basic"

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_automation_module" "az_accounts" {
  count = local.enabled ? 1 : 0

  name                    = "Az.Accounts"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name

  module_link {
    uri = "https://www.powershellgallery.com/api/v2/package/Az.Accounts"
  }
}

resource "azurerm_automation_module" "az_compute" {
  count = local.enabled ? 1 : 0

  name                    = "Az.Compute"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name

  module_link {
    uri = "https://www.powershellgallery.com/api/v2/package/Az.Compute"
  }

  depends_on = [azurerm_automation_module.az_accounts]
}

resource "azurerm_automation_module" "az_monitor" {
  count = local.enabled ? 1 : 0

  name                    = "Az.Monitor"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name

  module_link {
    uri = "https://www.powershellgallery.com/api/v2/package/Az.Monitor"
  }

  depends_on = [azurerm_automation_module.az_accounts]
}

resource "azurerm_role_assignment" "vm_contributor" {
  count = local.enabled ? 1 : 0

  scope                = data.azurerm_virtual_machine.target[0].id
  role_definition_name = "Virtual Machine Contributor"
  principal_id         = azurerm_automation_account.idle[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "vm_monitoring_reader" {
  count = local.enabled ? 1 : 0

  scope                = data.azurerm_virtual_machine.target[0].id
  role_definition_name = "Monitoring Reader"
  principal_id         = azurerm_automation_account.idle[0].identity[0].principal_id
}

resource "azurerm_automation_variable_string" "target_vm_resource_group" {
  count                   = local.enabled ? 1 : 0
  name                    = "TargetVmResourceGroup"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = local.target_vm_resource_group_name
}

resource "azurerm_automation_variable_string" "target_vm_name" {
  count                   = local.enabled ? 1 : 0
  name                    = "TargetVmName"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = local.target_vm_name
}

resource "azurerm_automation_variable_string" "keepalive_path" {
  count                   = local.enabled ? 1 : 0
  name                    = "KeepAlivePath"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = var.keepalive_path
}

resource "azurerm_automation_variable_string" "protected_process_names" {
  count                   = local.enabled ? 1 : 0
  name                    = "ProtectedProcessNames"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = local.protected_process_names_csv
}

resource "azurerm_automation_variable_int" "idle_lookback_minutes" {
  count                   = local.enabled ? 1 : 0
  name                    = "IdleLookbackMinutes"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = var.idle_lookback_minutes
}

resource "azurerm_automation_variable_int" "cpu_threshold_percent" {
  count                   = local.enabled ? 1 : 0
  name                    = "CpuThresholdPercent"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = var.cpu_threshold_percent
}

resource "azurerm_automation_variable_int" "network_threshold_bytes" {
  count                   = local.enabled ? 1 : 0
  name                    = "NetworkThresholdBytes"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = var.network_threshold_bytes
}

resource "azurerm_automation_variable_bool" "dry_run" {
  count                   = local.enabled ? 1 : 0
  name                    = "DryRun"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  value                   = var.dry_run
}

resource "azurerm_automation_runbook" "deallocate_idle" {
  count = local.enabled ? 1 : 0

  name                    = "Deallocate-IdleDevVm"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  location                = local.automation_location
  log_verbose             = true
  log_progress            = true
  description             = "Conditionally deallocates the ArchLucid Windows development VM when idle."
  runbook_type            = "PowerShell"
  content                 = file("${path.module}/runbooks/Deallocate-IdleDevVm.ps1")
  tags                    = var.tags

  depends_on = [
    azurerm_automation_module.az_accounts,
    azurerm_automation_module.az_compute,
    azurerm_automation_module.az_monitor,
  ]
}

resource "azurerm_automation_schedule" "every_interval" {
  count = local.enabled ? 1 : 0

  name                    = "every-${lower(var.automation_schedule_frequency)}-${var.automation_schedule_interval}"
  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  frequency               = var.automation_schedule_frequency
  interval                = var.automation_schedule_interval
  timezone                = var.schedule_timezone
  start_time              = local.schedule_start_time
  description             = "Cloud-side idle-check backup. Primary 15-minute cadence is the on-box Scheduled Task."

  lifecycle {
    ignore_changes = [start_time]
  }
}

resource "azurerm_automation_job_schedule" "deallocate_idle" {
  count = local.enabled ? 1 : 0

  resource_group_name     = local.automation_resource_group_name
  automation_account_name = azurerm_automation_account.idle[0].name
  schedule_name           = azurerm_automation_schedule.every_interval[0].name
  runbook_name            = azurerm_automation_runbook.deallocate_idle[0].name
}
