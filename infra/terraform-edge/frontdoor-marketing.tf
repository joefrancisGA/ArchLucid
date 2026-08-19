# Optional marketing edge behaviors (301 /pricing.json -> /pricing, custom hostname passthrough for operators).
# Custom hostname binding to Front Door is org-specific (DNS + managed cert); expose variables only unless extended later.

locals {
  fd_pricing_json_redirect_enabled = local.fd_enabled && var.enable_pricing_json_to_pricing_page_redirect
}

resource "azurerm_cdn_frontdoor_rule_set" "pricing_redirects" {
  count = local.fd_pricing_json_redirect_enabled ? 1 : 0

  name                     = "${var.front_door_profile_name}pricingrs"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main[0].id
}

resource "azurerm_cdn_frontdoor_rule" "pricing_json_to_html_pricing" {
  count = local.fd_pricing_json_redirect_enabled ? 1 : 0

  name                      = "pricingjson301"
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.pricing_redirects[0].id
  order                     = 1
  behavior_on_match         = "Stop"

  actions {
    url_redirect_action {
      redirect_type        = "Moved"
      redirect_protocol    = "MatchRequest"
      destination_path     = "/pricing"
      query_string         = ""
      destination_hostname = ""
    }
  }

  conditions {
    request_uri_condition {
      operator     = "BeginsWith"
      match_values = ["/pricing.json"]
    }
  }
}
