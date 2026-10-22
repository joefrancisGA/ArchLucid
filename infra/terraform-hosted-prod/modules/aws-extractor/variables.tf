variable "hosted_aws_extractor_enabled" {
  type        = bool
  description = "Enable Tier 2 hosted AWS extractor run endpoints (HostedAwsExtractor:Enabled)."
  default     = false
}

variable "cloud_polling_aws_enabled" {
  type        = bool
  description = "Enable leader-elected AWS auto-pull worker (CloudPolling:Aws:Enabled)."
  default     = false
}

variable "cloud_polling_aws_interval_hours" {
  type        = number
  description = "Auto-pull interval in hours when CloudPolling:Aws is enabled."
  default     = 24

  validation {
    condition     = var.cloud_polling_aws_interval_hours >= 1 && var.cloud_polling_aws_interval_hours <= 168
    error_message = "cloud_polling_aws_interval_hours must be between 1 and 168."
  }
}

variable "archlucid_managed_identity_client_id" {
  type        = string
  description = "User-assigned managed identity client id used as OIDC federation source for AssumeRoleWithWebIdentity."
  default     = ""
}
