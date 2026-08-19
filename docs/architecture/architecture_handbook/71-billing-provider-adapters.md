# 71. Billing provider adapters

`Billing:Provider` selects Stripe, Azure Marketplace, or no-op through one registry used by checkout/portal. Marketplace ChangePlan/ChangeQuantity can 202-ack without mutating when `GaEnabled` is false.

![Billing provider adapters](../architecture_diagrams/archlucid-billing-provider-adapters.svg)
