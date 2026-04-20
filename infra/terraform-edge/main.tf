# Edge (Front Door / WAF) — Terraform resource labels use `archlucid` naming (greenfield IaC).
# Rename via `terraform state mv` during a planned maintenance window.
# Tracked in docs/ARCHLUCID_RENAME_CHECKLIST.md Phase 7.5.

locals {
  fd_enabled = var.enable_front_door_waf

  fd_location = local.fd_enabled ? (
    var.create_resource_group ? var.location : data.azurerm_resource_group.fd_target[0].location
  ) : ""
}

data "azurerm_resource_group" "fd_target" {
  count = local.fd_enabled && !var.create_resource_group ? 1 : 0
  name  = var.resource_group_name
}

resource "azurerm_resource_group" "fd" {
  count    = local.fd_enabled && var.create_resource_group ? 1 : 0
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

locals {
  fd_resource_group_name = local.fd_enabled ? (
    var.create_resource_group ? azurerm_resource_group.fd[0].name : data.azurerm_resource_group.fd_target[0].name
  ) : ""

  origin_header = trimspace(var.origin_host_header) != "" ? trimspace(var.origin_host_header) : trimspace(var.backend_hostname)

  secondary_origin_enabled = local.fd_enabled && trimspace(var.secondary_backend_hostname) != ""

  secondary_origin_header = local.secondary_origin_enabled ? (
    trimspace(var.secondary_origin_host_header) != "" ? trimspace(var.secondary_origin_host_header) : trimspace(var.secondary_backend_hostname)
  ) : ""

  marketing_edge_enabled = local.fd_enabled && trimspace(var.marketing_backend_hostname) != ""

  # When splitting marketing vs API paths, WAF association must list every matched pattern set.
  front_door_waf_association_patterns = local.marketing_edge_enabled ? distinct(concat(var.marketing_site_route_patterns, var.api_route_patterns_when_marketing_enabled)) : var.route_patterns
}
