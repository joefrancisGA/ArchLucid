variable "posture_tier" {
  type        = string
  description = "Deployment posture tier for plan-time assertions (dev, staging, production). Set explicitly in tfvars per environment."
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.posture_tier)
    error_message = "posture_tier must be dev, staging, or production."
  }
}

variable "posture_waivers" {
  type = list(object({
    id     = string
    reason = string
  }))
  description = "Documented posture exceptions (each entry requires id and reason)."
  default     = []

  validation {
    condition = alltrue([
      for w in var.posture_waivers :
      length(trimspace(w.id)) > 0 && length(trimspace(w.reason)) > 0
    ])
    error_message = "Each posture_waivers entry must have non-empty id and reason."
  }
}

locals {
  posture_waiver_ids               = toset([for w in var.posture_waivers : w.id])
  posture_is_production            = var.posture_tier == "production"
  posture_is_staging               = var.posture_tier == "staging"
  posture_is_staging_or_production = contains(["staging", "production"], var.posture_tier)
}
