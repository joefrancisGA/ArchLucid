variable "subscription_id" {
  description = "Subscription that holds the tooling resource group."
  type        = string
}

variable "resource_group_name" {
  description = "The tooling's own resource group, separate from the estate it analyzes."
  type        = string
  default     = "rg-security-tooling"
}

variable "location" {
  description = "Region for every tooling resource; part of the residency decision in section 13.5."
  type        = string
}

variable "evidence_account_name" {
  description = "Globally unique name for the evidence storage account."
  type        = string
}

variable "snapshot_retention_days" {
  description = "Immutability period for evidence snapshots."
  type        = number
}

variable "openai_account_name" {
  description = "Name and custom subdomain of the Azure OpenAI account."
  type        = string
}

variable "model_name" {
  description = "Model to deploy."
  type        = string
}

variable "model_version" {
  description = "Pinned model version."
  type        = string
}

variable "deployment_type" {
  description = "Deployment SKU, which sets where prompts may be processed."
  type        = string
}

variable "private_endpoint_subnet_id" {
  description = "Subnet for the model service's private endpoint."
  type        = string
}

variable "private_endpoint_vnet_id" {
  description = "Virtual network the private DNS zone is linked to."
  type        = string
}
