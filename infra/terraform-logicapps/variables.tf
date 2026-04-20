variable "enable_logic_apps" {
  type        = bool
  description = "When true, deploy a Logic App (Standard) host plus backing storage and WS1 plan. Keep false until VNet + Service Bus subscriptions are designed."
  default     = false
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group for Logic App Standard resources."
  default     = ""
}

variable "location" {
  type        = string
  description = "Azure region (must match the resource group when enable_logic_apps is true)."
  default     = ""
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to created resources."
}

variable "storage_account_name" {
  type        = string
  description = "Globally unique storage account name (lowercase alphanumeric, max 24) for the Logic App file share backend."
  default     = ""
}

variable "app_service_plan_name" {
  type        = string
  description = "App Service plan name hosting Logic App Standard (WS1)."
  default     = "asp-archlucid-logic"
}

variable "logic_app_name" {
  type        = string
  description = "Logic App (Standard) site name."
  default     = "archlucid-logic-edge"
}

variable "storage_share_name" {
  type        = string
  description = "Azure Files share name used by the Logic App runtime (workflow definitions are deployed separately)."
  default     = "workflow-content"
}

variable "enable_governance_approval_logic_app" {
  type        = bool
  description = "When true, deploy a second Logic App (Standard) host for governance-approval-routing workflows (separate plan + storage from the generic edge host)."
  default     = false
}

variable "governance_storage_account_name" {
  type        = string
  description = "Globally unique storage account name for the governance Logic App file share (required when enable_governance_approval_logic_app is true)."
  default     = ""
}

variable "governance_storage_share_name" {
  type        = string
  description = "Azure Files share name for governance workflow runtime files."
  default     = "governance-workflow-content"
}

variable "governance_app_service_plan_name" {
  type        = string
  description = "App Service plan name for the governance Logic App (WS1)."
  default     = "asp-archlucid-logic-governance"
}

variable "governance_logic_app_name" {
  type        = string
  description = "Logic App (Standard) site name for governance approval routing."
  default     = "archlucid-logic-governance-approval"
}

variable "enable_marketplace_fulfillment_logic_app" {
  type        = bool
  description = "When true, deploy a Logic App (Standard) host for marketplace-fulfillment-handoff (separate plan + storage from edge and governance hosts)."
  default     = false
}

variable "marketplace_fulfillment_storage_account_name" {
  type        = string
  description = "Globally unique storage account name for the Marketplace fulfillment Logic App file share (required when enable_marketplace_fulfillment_logic_app is true)."
  default     = ""
}

variable "marketplace_fulfillment_storage_share_name" {
  type        = string
  description = "Azure Files share name for Marketplace fulfillment workflow runtime files."
  default     = "marketplace-workflow-content"
}

variable "marketplace_fulfillment_app_service_plan_name" {
  type        = string
  description = "App Service plan name for the Marketplace fulfillment Logic App (WS1)."
  default     = "asp-archlucid-logic-marketplace-fulfillment"
}

variable "marketplace_fulfillment_logic_app_name" {
  type        = string
  description = "Logic App (Standard) site name for Marketplace webhook-received fulfillment fan-out."
  default     = "archlucid-logic-marketplace-fulfillment"
}

variable "enable_trial_lifecycle_logic_app" {
  type        = bool
  description = "When true, deploy a dedicated Logic App (Standard) host for trial-lifecycle-email workflows (separate plan + storage from other hosts)."
  default     = false
}

variable "trial_lifecycle_storage_account_name" {
  type        = string
  description = "Globally unique storage account name for the trial lifecycle Logic App file share (required when enable_trial_lifecycle_logic_app is true)."
  default     = ""
}

variable "trial_lifecycle_storage_share_name" {
  type        = string
  description = "Azure Files share name for trial lifecycle workflow runtime files."
  default     = "trial-lifecycle-workflow-content"
}

variable "trial_lifecycle_app_service_plan_name" {
  type        = string
  description = "App Service plan name for the trial lifecycle Logic App (WS1)."
  default     = "asp-archlucid-logic-trial-lifecycle"
}

variable "trial_lifecycle_logic_app_name" {
  type        = string
  description = "Logic App (Standard) site name for trial lifecycle email fan-out."
  default     = "archlucid-logic-trial-lifecycle-email"
}

variable "enable_incident_chatops_logic_app" {
  type        = bool
  description = "When true, deploy a dedicated Logic App (Standard) host for incident ChatOps (alert fired / resolved)."
  default     = false
}

variable "incident_chatops_storage_account_name" {
  type        = string
  description = "Globally unique storage account name for the incident ChatOps Logic App file share (required when enable_incident_chatops_logic_app is true)."
  default     = ""
}

variable "incident_chatops_storage_share_name" {
  type        = string
  description = "Azure Files share name for incident ChatOps workflow runtime files."
  default     = "incident-chatops-workflow-content"
}

variable "incident_chatops_app_service_plan_name" {
  type        = string
  description = "App Service plan name for the incident ChatOps Logic App (WS1)."
  default     = "asp-archlucid-logic-incident-chatops"
}

variable "incident_chatops_logic_app_name" {
  type        = string
  description = "Logic App (Standard) site name for incident ChatOps."
  default     = "archlucid-logic-incident-chatops"
}

variable "enable_promotion_customer_notify_logic_app" {
  type        = bool
  description = "When true, deploy a dedicated Logic App (Standard) host for prod promotion customer notifications."
  default     = false
}

variable "promotion_customer_notify_storage_account_name" {
  type        = string
  description = "Globally unique storage account name for the promotion customer-notify Logic App file share (required when enable_promotion_customer_notify_logic_app is true)."
  default     = ""
}

variable "promotion_customer_notify_storage_share_name" {
  type        = string
  description = "Azure Files share name for promotion customer-notify workflow runtime files."
  default     = "promotion-customer-workflow-content"
}

variable "promotion_customer_notify_app_service_plan_name" {
  type        = string
  description = "App Service plan name for the promotion customer-notify Logic App (WS1)."
  default     = "asp-archlucid-logic-promotion-customer"
}

variable "promotion_customer_notify_logic_app_name" {
  type        = string
  description = "Logic App (Standard) site name for prod promotion customer fan-out."
  default     = "archlucid-logic-promotion-customer-notify"
}

variable "enable_logic_app_diagnostic_settings" {
  type        = bool
  description = "When true and logic_app_diagnostic_log_analytics_workspace_id is set, create azurerm_monitor_diagnostic_setting for each deployed Logic App Standard site (platform + workflow logs via category group allLogs)."
  default     = false
}

variable "logic_app_diagnostic_log_analytics_workspace_id" {
  type        = string
  description = "Full Azure resource ID of the Log Analytics workspace receiving Logic App diagnostics (e.g. /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{name}). Required when enable_logic_app_diagnostic_settings is true."
  default     = ""
}
