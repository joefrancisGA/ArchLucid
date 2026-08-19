variable "hosted_gcp_extractor_enabled" {
  type        = bool
  description = "Enable Tier 2 hosted GCP extractor run endpoints (HostedGcpExtractor:Enabled)."
  default     = false
}

variable "cloud_polling_gcp_enabled" {
  type        = bool
  description = "Enable leader-elected GCP auto-pull worker (CloudPolling:Gcp:Enabled)."
  default     = false
}

variable "cloud_polling_gcp_interval_hours" {
  type        = number
  description = "Auto-pull interval in hours when CloudPolling:Gcp is enabled."
  default     = 24

  validation {
    condition     = var.cloud_polling_gcp_interval_hours >= 1 && var.cloud_polling_gcp_interval_hours <= 168
    error_message = "cloud_polling_gcp_interval_hours must be between 1 and 168."
  }
}

variable "archlucid_managed_identity_client_id" {
  type        = string
  description = "User-assigned managed identity client id used as OIDC federation source for GCP Workload Identity Federation."
  default     = ""
}
