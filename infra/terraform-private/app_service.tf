# TB-101: Legacy App Service regional VNet integration — not used by the Container Apps compute path.
# This resource is created only when both linux_web_app_id and web_app_vnet_integration_subnet_id are non-empty.
# Production-like pilots run API/Worker/UI on Azure Container Apps (infra/terraform-container-apps).
# Leave variables empty unless you operate a separate Linux Web App that must share this private VNet.

resource "azurerm_app_service_virtual_network_swift_connection" "web_app" {
  count = (
    local.pe_enabled &&
    length(trimspace(var.linux_web_app_id)) > 0 &&
    length(trimspace(var.web_app_vnet_integration_subnet_id)) > 0
  ) ? 1 : 0

  app_service_id = var.linux_web_app_id
  subnet_id      = var.web_app_vnet_integration_subnet_id
}
