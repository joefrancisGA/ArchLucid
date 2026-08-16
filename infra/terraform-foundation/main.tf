# Wave 1 metadata contract. Azure apply stays on the leaf roots listed below
# (each leaf keeps its own state and resource addresses).

locals {
  child_roots = [
    {
      order         = 1
      id            = "private"
      path          = "infra/terraform-private"
      notes         = "VNet, private endpoints, private DNS - foundation for data planes."
      consumes_from = ["storage"]
    },
    {
      order         = 2
      id            = "keyvault"
      path          = "infra/terraform-keyvault"
      notes         = "Key Vault plus TB-656 user-assigned API/Worker identities."
      consumes_from = []
    },
  ]
}
