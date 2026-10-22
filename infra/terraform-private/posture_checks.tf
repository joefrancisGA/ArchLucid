check "posture_production_requires_private_data_plane" {
  assert {
    condition     = !local.posture_is_production || var.enable_private_data_plane
    error_message = "posture_tier = production requires enable_private_data_plane = true (VNet + private endpoints for SQL, blob, and optional Key Vault / Search)."
  }
}
