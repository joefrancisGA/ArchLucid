# Shared deployment posture tier and waiver inputs for all infra stacks.
# Validation lives in ../modules/posture; stacks re-export locals for posture_checks.tf.

variable "posture_tier" {
  type        = string
  description = "Deployment posture tier for plan-time assertions (dev, staging, production). Set explicitly in tfvars per environment."
  default     = "dev"
}

variable "posture_waivers" {
  type = list(object({
    id     = string
    reason = string
  }))
  description = "Documented posture exceptions (each entry requires id and reason)."
  default     = []
}

module "posture" {
  source = "../modules/posture"

  posture_tier    = var.posture_tier
  posture_waivers = var.posture_waivers
}

locals {
  posture_waiver_ids               = module.posture.waiver_ids
  posture_is_production            = module.posture.is_production
  posture_is_staging               = module.posture.is_staging
  posture_is_staging_or_production = module.posture.is_staging_or_production
}
