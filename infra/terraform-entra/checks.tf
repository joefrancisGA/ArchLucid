check "entra_identifier_uri" {
  assert {
    condition     = !var.enable_entra_api_app || length(trimspace(var.api_identifier_uri)) > 0
    error_message = "api_identifier_uri must be non-empty when enable_entra_api_app is true."
  }
}
