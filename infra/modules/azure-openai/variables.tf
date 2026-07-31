variable "location" {
  type        = string
  description = "Azure region for the OpenAI account (default US East)."
  default     = "eastus"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group name."
}

variable "account_name" {
  type        = string
  description = "Globally unique Cognitive Services account name."
}

variable "deployment_name" {
  type        = string
  description = "Default (Standard / Terra) chat deployment name wired to AzureOpenAI:DeploymentName."
  default     = "gpt-5.6-terra"
}

variable "model_name" {
  type        = string
  description = "Foundry model name for the default chat deployment."
  default     = "gpt-5.6-terra"
}

variable "model_version" {
  type        = string
  description = "Foundry model version for the default chat deployment."
  default     = "2026-07-09"
}

variable "sku_name" {
  type        = string
  description = "Cognitive deployment SKU (GlobalStandard for GPT-5.6 Global Standard PAYG)."
  default     = "GlobalStandard"
}

variable "sku_capacity" {
  type        = number
  description = "TPM capacity units for the default (Terra) chat deployment."
  default     = 10
}

variable "enable_economy_deployment" {
  type        = bool
  description = "When true, provision the Economy (Luna) chat deployment."
  default     = true
}

variable "economy_deployment_name" {
  type        = string
  description = "Economy tier deployment name (ArchLucid:AgentModelTiers:EconomyDeploymentName)."
  default     = "gpt-5.6-luna"
}

variable "economy_model_name" {
  type        = string
  description = "Foundry model name for the Economy deployment."
  default     = "gpt-5.6-luna"
}

variable "economy_model_version" {
  type        = string
  description = "Foundry model version for the Economy deployment."
  default     = "2026-07-09"
}

variable "economy_sku_capacity" {
  type        = number
  description = "TPM capacity units for the Economy (Luna) deployment."
  default     = 10
}

variable "enable_premium_deployment" {
  type        = bool
  description = "When true, provision the Premium (Sol) chat deployment."
  default     = true
}

variable "premium_deployment_name" {
  type        = string
  description = "Premium tier deployment name (ArchLucid:AgentModelTiers:PremiumDeploymentName)."
  default     = "gpt-5.6-sol"
}

variable "premium_model_name" {
  type        = string
  description = "Foundry model name for the Premium deployment."
  default     = "gpt-5.6-sol"
}

variable "premium_model_version" {
  type        = string
  description = "Foundry model version for the Premium deployment."
  default     = "2026-07-09"
}

variable "premium_sku_capacity" {
  type        = number
  description = "TPM capacity units for the Premium (Sol) deployment."
  default     = 10
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}
