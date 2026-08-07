# 7. Threat model — webhooks (security)

Outbound and inbound webhook surfaces use HMAC/CloudEvents envelopes, shared-secret handling, and dry-run probes where enabled. Reviewers should separate **outbound delivery** (customer HTTP / Service Bus) from **inbound** abuse assumptions.

![Threat webhooks](../../architecture_diagrams/archlucid-threat-webhooks.svg)
