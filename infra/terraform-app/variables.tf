variable "deployment_profile" {
  type        = string
  default     = "hosted"
  description = "hosted = three-wave SaaS apply; pilot/production = documentation labels only."

  validation {
    condition     = contains(["hosted", "pilot", "production"], var.deployment_profile)
    error_message = "deployment_profile must be hosted, pilot, or production."
  }
}
