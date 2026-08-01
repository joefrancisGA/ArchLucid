output "log_analytics_workspace_id" {
  description = "Resource ID of the Log Analytics workspace backing the Container Apps environment."
  value       = try(azurerm_log_analytics_workspace.container_apps[0].id, null)
}

output "container_app_environment_id" {
  description = "Resource ID of the Container Apps managed environment."
  value       = try(azurerm_container_app_environment.main[0].id, null)
}

output "container_app_environment_default_domain" {
  description = "Default DNS suffix for apps in this environment (useful for internal DNS)."
  value       = try(azurerm_container_app_environment.main[0].default_domain, null)
}

output "api_container_app_fqdn" {
  description = "FQDN of the latest API revision (ingress hostname)."
  value       = try(azurerm_container_app.api[0].latest_revision_fqdn, null)
}

output "api_https_url" {
  description = "HTTPS URL for the API (configure UI proxy / env to this host)."
  value       = try("https://${azurerm_container_app.api[0].latest_revision_fqdn}", null)
}

output "api_system_assigned_principal_id" {
  description = "Object ID of the API container app system-assigned managed identity (for extra RBAC beyond blob offload)."
  value       = try(azurerm_container_app.api[0].identity[0].principal_id, null)
}

output "worker_system_assigned_principal_id" {
  description = "Object ID of the worker container app system-assigned managed identity."
  value       = try(azurerm_container_app.worker[0].identity[0].principal_id, null)
}

output "api_sql_runtime_identity_name" {
  description = "Name of the least-privilege SQL runtime user-assigned identity (null unless enable_api_sql_runtime_identity is true). Use as the login name in CREATE USER [name] FROM EXTERNAL PROVIDER."
  value       = try(azurerm_user_assigned_identity.api_sql_runtime[0].name, null)
}

output "api_sql_runtime_identity_client_id" {
  description = "Client (application) ID of the least-privilege SQL runtime identity. Use as User Id=<client-id> in the ConnectionStrings:ArchLucidRuntime connection string (Authentication=Active Directory Managed Identity)."
  value       = try(azurerm_user_assigned_identity.api_sql_runtime[0].client_id, null)
}

output "api_sql_runtime_identity_principal_id" {
  description = "Object (principal) ID of the least-privilege SQL runtime identity, for any additional Azure RBAC assignments."
  value       = try(azurerm_user_assigned_identity.api_sql_runtime[0].principal_id, null)
}

output "worker_container_app_fqdn" {
  description = "FQDN of the latest worker revision when ingress is enabled (null if internal-only without public hostname)."
  value       = try(azurerm_container_app.worker[0].latest_revision_fqdn, null)
}

output "ui_container_app_fqdn" {
  description = "FQDN of the latest Operator UI revision."
  value       = try(azurerm_container_app.ui[0].latest_revision_fqdn, null)
}

output "ui_https_url" {
  description = "HTTPS URL for the Operator UI."
  value       = try("https://${azurerm_container_app.ui[0].latest_revision_fqdn}", null)
}

output "marketing_ui_container_app_fqdn" {
  description = "FQDN of the latest marketing UI revision (null when enable_marketing_ui_container_app is false)."
  value       = try(azurerm_container_app.ui_marketing[0].latest_revision_fqdn, null)
}

output "marketing_ui_https_url" {
  description = "HTTPS URL for the marketing UI Container App."
  value       = try("https://${azurerm_container_app.ui_marketing[0].latest_revision_fqdn}", null)
}

output "marketing_ui_container_app_name" {
  description = "Marketing UI Container App name when provisioned; otherwise null."
  value       = try(azurerm_container_app.ui_marketing[0].name, null)
}

output "container_apps_consumption_budget_id" {
  description = "Resource id of the Container Apps consumption budget when enable_container_apps_consumption_budget is true; otherwise null."
  value       = try(azurerm_consumption_budget_resource_group.container_apps[0].id, null)
}

output "secondary_api_container_app_fqdn" {
  description = "FQDN of the secondary-region API when secondary_region_stack_enabled; otherwise null (Front Door secondary origin)."
  value       = try(azurerm_container_app.api_secondary[0].latest_revision_fqdn, null)
}

output "secondary_api_https_url" {
  description = "HTTPS URL for the secondary-region API revision."
  value       = try("https://${azurerm_container_app.api_secondary[0].latest_revision_fqdn}", null)
}

output "secondary_ui_https_url" {
  description = "HTTPS URL for the secondary-region Operator UI."
  value       = try("https://${azurerm_container_app.ui_secondary[0].latest_revision_fqdn}", null)
}

output "scheduled_container_app_job_names" {
  description = "Names of provisioned scheduled Container Apps Jobs (empty when container_jobs is unset)."
  value       = local.enabled ? keys(azurerm_container_app_job.scheduled) : []
}

output "event_container_app_job_names" {
  description = "Names of provisioned event-driven (KEDA) Container Apps Jobs."
  value       = local.enabled ? keys(azurerm_container_app_job.event_driven) : []
}

output "scheduled_container_app_job_principal_ids" {
  description = "System-assigned principal IDs for scheduled jobs (map keyed by job name)."
  value = local.enabled ? {
    for k, j in azurerm_container_app_job.scheduled : k => j.identity[0].principal_id
  } : {}
}

output "event_container_app_job_principal_ids" {
  description = "System-assigned principal IDs for event-driven jobs (map keyed by job name)."
  value = local.enabled ? {
    for k, j in azurerm_container_app_job.event_driven : k => j.identity[0].principal_id
  } : {}
}

output "content_safety_account_id" {
  description = "ARM id of the Content Safety account when enable_content_safety_account is true; otherwise null."
  value       = try(azurerm_cognitive_account.content_safety[0].id, null)
}

output "content_safety_endpoint" {
  description = "HTTPS endpoint for ArchLucid:ContentSafety:Endpoint when the account is managed here; otherwise null."
  value       = try(azurerm_cognitive_account.content_safety[0].endpoint, null)
}

output "communication_email_service_id" {
  description = "ARM id of the Communication Service when enable_communication_email_account is true; otherwise null."
  value       = try(azurerm_communication_service.communication_email[0].id, null)
}

output "communication_email_endpoint" {
  description = "HTTPS ACS endpoint for Email:AzureCommunicationServicesEndpoint (set GitHub var DEV_ACS_EMAIL_ENDPOINT)."
  value = local.communication_email_enabled ? "https://${azurerm_communication_service.communication_email[0].hostname}" : null
}

output "communication_email_from_address" {
  description = "Verified sender address for Email:FromAddress (e.g. noreply@archlucid.net)."
  value       = local.communication_email_from_address
}

output "communication_email_domain_verification_records" {
  description = "DNS records to publish at your DNS host before mail sends. Set communication_email_initiate_domain_verification = true after publishing."
  value       = try(azurerm_email_communication_service_domain.communication_email_custom[0].verification_records, null)
}
