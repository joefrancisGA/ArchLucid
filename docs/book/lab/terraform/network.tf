# Chapter 5: hub and spokes, a broad firewall rule, and an unfinished private endpoint.
# Everything here is skipped when deploy_network is false.

locals {
  network_count = var.deploy_network ? 1 : 0
}

resource "azurerm_virtual_network" "hub" {
  count = local.network_count

  name                = "vnet-hub"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "firewall" {
  count = local.network_count

  # Azure requires these exact subnet names for a firewall.
  name                 = "AzureFirewallSubnet"
  resource_group_name  = azurerm_resource_group.network.name
  virtual_network_name = azurerm_virtual_network.hub[0].name
  address_prefixes     = ["10.0.0.0/26"]
}

resource "azurerm_subnet" "firewall_management" {
  count = local.network_count

  name                 = "AzureFirewallManagementSubnet"
  resource_group_name  = azurerm_resource_group.network.name
  virtual_network_name = azurerm_virtual_network.hub[0].name
  address_prefixes     = ["10.0.0.64/26"]
}

resource "azurerm_virtual_network" "payments" {
  count = local.network_count

  name                = "vnet-payments"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  address_space       = ["10.1.0.0/16"]
}

resource "azurerm_subnet" "payments_app" {
  count = local.network_count

  name                 = "snet-payments-app"
  resource_group_name  = azurerm_resource_group.network.name
  virtual_network_name = azurerm_virtual_network.payments[0].name
  address_prefixes     = ["10.1.1.0/24"]

  # App Service virtual network integration needs a subnet delegated to it.
  delegation {
    name = "app-service"

    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "payments_endpoints" {
  count = local.network_count

  name                 = "snet-payments-pe"
  resource_group_name  = azurerm_resource_group.network.name
  virtual_network_name = azurerm_virtual_network.payments[0].name
  address_prefixes     = ["10.1.2.0/24"]
}

resource "azurerm_virtual_network" "dev" {
  count = local.network_count

  name                = "vnet-dev"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  address_space       = ["10.2.0.0/16"]
}

resource "azurerm_subnet" "dev" {
  count = local.network_count

  name                 = "snet-dev"
  resource_group_name  = azurerm_resource_group.network.name
  virtual_network_name = azurerm_virtual_network.dev[0].name
  address_prefixes     = ["10.2.1.0/24"]
}

locals {
  spoke_names = var.deploy_network ? toset(["payments", "dev"]) : toset([])
}

# Forwarded traffic must be allowed both ways, or spoke-to-spoke flows through the firewall are dropped.
resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  for_each = local.spoke_names

  name                      = "hub-to-${each.key}"
  resource_group_name       = azurerm_resource_group.network.name
  virtual_network_name      = azurerm_virtual_network.hub[0].name
  remote_virtual_network_id = each.key == "payments" ? azurerm_virtual_network.payments[0].id : azurerm_virtual_network.dev[0].id
  allow_forwarded_traffic   = true
}

resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  for_each = local.spoke_names

  name                      = "${each.key}-to-hub"
  resource_group_name       = azurerm_resource_group.network.name
  virtual_network_name      = each.key == "payments" ? azurerm_virtual_network.payments[0].name : azurerm_virtual_network.dev[0].name
  remote_virtual_network_id = azurerm_virtual_network.hub[0].id
  allow_forwarded_traffic   = true
}

resource "azurerm_public_ip" "firewall" {
  for_each = var.deploy_network ? toset(["data", "management"]) : toset([])

  name                = "pip-fw-${each.key}"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_firewall_policy" "hub" {
  count = local.network_count

  name                = "afwp-hub"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  sku                 = "Basic"
}

resource "azurerm_firewall_policy_rule_collection_group" "hub" {
  count = local.network_count

  name               = "spoke-traffic"
  firewall_policy_id = azurerm_firewall_policy.hub[0].id
  priority           = 100

  network_rule_collection {
    name     = "allow-internal"
    priority = 100
    action   = "Allow"

    # The opening story's rule: it turns hub-and-spoke into a flat network. Chapter 5 Step 8 narrows it.
    rule {
      name                  = "any-internal-to-any-internal"
      protocols             = ["Any"]
      source_addresses      = ["10.0.0.0/8"]
      destination_addresses = ["10.0.0.0/8"]
      destination_ports     = ["*"]
    }
  }
}

# Basic is the cheapest SKU that supports network rules. It needs a separate management IP configuration.
resource "azurerm_firewall" "hub" {
  count = local.network_count

  name                = "afw-hub"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  sku_name            = "AZFW_VNet"
  sku_tier            = "Basic"
  firewall_policy_id  = azurerm_firewall_policy.hub[0].id

  ip_configuration {
    name                 = "data"
    subnet_id            = azurerm_subnet.firewall[0].id
    public_ip_address_id = azurerm_public_ip.firewall["data"].id
  }

  management_ip_configuration {
    name                 = "management"
    subnet_id            = azurerm_subnet.firewall_management[0].id
    public_ip_address_id = azurerm_public_ip.firewall["management"].id
  }
}

# Sends spoke-to-spoke traffic through the firewall, where the broad rule allows it.
resource "azurerm_route_table" "spokes" {
  count = local.network_count

  name                = "rt-spokes"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location

  route {
    name                   = "internal-via-firewall"
    address_prefix         = "10.0.0.0/8"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = azurerm_firewall.hub[0].ip_configuration[0].private_ip_address
  }
}

resource "azurerm_subnet_route_table_association" "payments_app" {
  count = local.network_count

  subnet_id      = azurerm_subnet.payments_app[0].id
  route_table_id = azurerm_route_table.spokes[0].id
}

resource "azurerm_subnet_route_table_association" "dev" {
  count = local.network_count

  subnet_id      = azurerm_subnet.dev[0].id
  route_table_id = azurerm_route_table.spokes[0].id
}

# Hygiene, not a path: RDP from one corporate range, not from the internet.
resource "azurerm_network_security_group" "dev" {
  count = local.network_count

  name                = "nsg-dev"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location

  security_rule {
    name                       = "allow-rdp-corporate"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefix      = var.corporate_ip_range
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "dev" {
  count = local.network_count

  subnet_id                 = azurerm_subnet.dev[0].id
  network_security_group_id = azurerm_network_security_group.dev[0].id
}

resource "azurerm_private_dns_zone" "blob" {
  count = local.network_count

  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.network.name
}

# Linked to the payments spoke only. The dev spoke resolving custdata to its public address is Chapter 5 Step 5's surprise.
resource "azurerm_private_dns_zone_virtual_network_link" "blob_payments" {
  count = local.network_count

  name                  = "payments"
  resource_group_name   = azurerm_resource_group.network.name
  private_dns_zone_name = azurerm_private_dns_zone.blob[0].name
  virtual_network_id    = azurerm_virtual_network.payments[0].id
}

resource "azurerm_private_endpoint" "custdata_blob" {
  count = local.network_count

  name                = "pe-custdata-blob"
  resource_group_name = azurerm_resource_group.network.name
  location            = azurerm_resource_group.network.location
  subnet_id           = azurerm_subnet.payments_endpoints[0].id

  private_service_connection {
    name                           = "custdata-blob"
    private_connection_resource_id = azurerm_storage_account.custdata.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "blob"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob[0].id]
  }
}

resource "random_password" "dev_vm" {
  length           = 24
  special          = true
  override_special = "!#%*-_=+"
}

resource "azurerm_network_interface" "dev_vm" {
  count = local.network_count

  name                = "nic-dev-vm"
  resource_group_name = azurerm_resource_group.dev.name
  location            = azurerm_resource_group.dev.location

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.dev[0].id
    private_ip_address_allocation = "Dynamic"
  }
}

# No public IP. Chapter 5 Step 5 runs DNS checks with Run Command.
resource "azurerm_linux_virtual_machine" "dev_vm" {
  count = local.network_count

  name                            = "dev-vm"
  resource_group_name             = azurerm_resource_group.dev.name
  location                        = azurerm_resource_group.dev.location
  size                            = "Standard_B1s"
  admin_username                  = "labadmin"
  admin_password                  = random_password.dev_vm.result
  disable_password_authentication = false
  network_interface_ids           = [azurerm_network_interface.dev_vm[0].id]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
}
