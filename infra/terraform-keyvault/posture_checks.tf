check "posture_production_requires_key_vault" {
  assert {
    condition     = !local.posture_is_production || var.enable_key_vault
    error_message = "posture_tier = production requires enable_key_vault = true (public_network_access_enabled is false on the vault; pair with terraform-private for private endpoints)."
  }
}
