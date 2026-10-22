variable "customer_tenant_id" {
  type        = string
  description = "Customer Entra tenant id where the extractor service principal is created."
}

variable "archlucid_tenant_id" {
  type        = string
  description = "ArchLucid SaaS Entra tenant id (WIF issuer tenant)."
}

variable "archlucid_managed_identity_object_id" {
  type        = string
  description = "Object id of ArchLucid's user-assigned managed identity (WIF subject)."
}

variable "subscription_id" {
  type        = string
  description = "Customer Azure subscription id to scope Reader + Cost Management Reader assignments."
}
