variable "subscription_id" {
  description = "Lab subscription. The book calls it sub-payments-prod."
  type        = string
}

variable "acknowledge_deliberately_vulnerable" {
  description = "Set to true to confirm this is a dedicated lab tenant and subscription. The lab exposes customer-data storage publicly with shared keys enabled, among other deliberate weaknesses."
  type        = bool

  validation {
    condition     = var.acknowledge_deliberately_vulnerable
    error_message = "This lab is deliberately vulnerable. Set acknowledge_deliberately_vulnerable = true only in a tenant and subscription you use for nothing else (Appendix A.1)."
  }
}

variable "location" {
  description = "Azure region for every lab resource."
  type        = string
  default     = "eastus2"
}

variable "github_repository" {
  description = "owner/repo trusted by the payments-deploy federated credential."
  type        = string
  default     = "contoso/payments"
}

variable "github_trust" {
  description = "Subject suffix after repo:<owner/repo>:. Chapter 4 Step 4 changes it to environment:production."
  type        = string
  default     = "ref:refs/heads/main"
}

variable "corporate_ip_range" {
  description = "Source range for the hygiene NSG rule that allows RDP. The default is a documentation range."
  type        = string
  default     = "203.0.113.0/24"
}

variable "guest_email" {
  description = "Address for the never-redeemed guest invitation. No invitation email is sent."
  type        = string
  default     = "lab-guest@example.com"
}

variable "deploy_network" {
  description = "Deploy the hub firewall, spokes, private endpoint, and dev VM (Chapter 5). Most of the lab's cost."
  type        = bool
  default     = true
}

variable "builtin_policy_storage_prevent_shared_key_id" {
  description = "Built-in policy 'Storage accounts should prevent shared key access', used by Chapter 9's change."
  type        = string
  default     = "/providers/Microsoft.Authorization/policyDefinitions/8c6a50c6-9ffd-4ae7-986f-5fa6111f9a54"
}
