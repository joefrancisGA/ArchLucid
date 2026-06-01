check "acr_name_when_enabled" {
  assert {
    condition     = !var.enable_acr || (length(var.acr_name) >= 5 && length(var.acr_name) <= 50)
    error_message = "acr_name must be 5-50 characters when enable_acr is true."
  }
}
