variable "resource_group_name" {
  type        = string
  description = "Resource group that will own the Service Bus namespace."
}

variable "location" {
  type        = string
  description = "Azure region for the namespace (e.g. eastus)."
}

variable "namespace_name" {
  type        = string
  description = "Globally unique Service Bus namespace name."
  default     = "archlucid-events"
}

variable "topic_name" {
  type        = string
  description = "Topic used for ArchLucid integration JSON events."
  default     = "archlucid-integration-events"
}

variable "sku" {
  type        = string
  description = "Service Bus SKU (Basic | Standard | Premium). Standard supports topics."
  default     = "Standard"
}

variable "zone_redundant" {
  type        = bool
  description = "When true, enable zone redundancy (Standard/Premium; requires region support)."
  default     = false
}

variable "max_delivery_count" {
  type        = number
  description = "Max deliveries before Service Bus dead-letters the message on the subscription."
  default     = 10
}

variable "worker_subscription_name" {
  type        = string
  description = "Subscription consumed by ArchLucid workers (load leveling across replicas)."
  default     = "archlucid-worker"
}

variable "external_subscription_name" {
  type        = string
  description = "Subscription for external/automation consumers (fan-out)."
  default     = "archlucid-external"
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to created resources."
  default     = {}
}

variable "api_managed_identity_principal_id" {
  type        = string
  description = "Optional Entra principal id for the API managed identity (Azure Service Bus Data Sender)."
  default     = ""
}

variable "worker_managed_identity_principal_id" {
  type        = string
  description = "Optional Entra principal id for the worker managed identity (Sender + Receiver)."
  default     = ""
}

variable "enable_private_endpoint" {
  type        = bool
  description = "When true, create a private endpoint for the namespace (recommended with terraform-private)."
  default     = false
}

variable "private_endpoints_subnet_id" {
  type        = string
  description = "Subnet id for private endpoint NICs (delegation not required)."
  default     = ""
}

variable "private_dns_zone_ids" {
  type        = list(string)
  description = "Private DNS zone resource ids for privatelink.servicebus.windows.net (from terraform-private)."
  default     = []
}
