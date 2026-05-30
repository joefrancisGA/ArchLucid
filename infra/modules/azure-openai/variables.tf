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
  description = "Default model deployment name wired to app settings."
  default     = "gpt-4o"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}