output "automation_account_name" {
  value = local.enabled ? azurerm_automation_account.idle[0].name : null
}

output "automation_principal_id" {
  value = local.enabled ? azurerm_automation_account.idle[0].identity[0].principal_id : null
}

output "dry_run" {
  value = var.dry_run
}

output "keepalive_path" {
  value = var.keepalive_path
}

output "local_task_primary" {
  value = "Primary control is the on-box Scheduled Task ArchLucid-DevVm-IdleDeallocate under C:\\AzureVM. This Automation Account is an optional cloud-side backup."
}
