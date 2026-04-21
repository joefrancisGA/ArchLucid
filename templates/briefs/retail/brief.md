<!--
Vertical: retail -- Time to first commit (estimated): 32 minutes
-->
# Brief: HarborOne Omnichannel Checkout (Azure)

**HarborOne** extends brick-and-mortar with unified cart across web, mobile, and POS on **Azure** **production** path. **Topology:** isolate **cardholder data environment** (CDE) subnets, tokenization before analytics, edge caching only for non-sensitive catalog. Prefer async checkout finalization with idempotent payment intents. **Cost:** target **$14,000/month** operating envelope using consumption for burst checkout, Redis cluster sized for peak sessions, CDN only for static assets. **Compliance (PCI-DSS):** no PAN in application logs, quarterly ASV scope documented, segmentation tests as code. **Critic:** flag shared databases between CDE and marketing, missing HSM boundaries, or partner webhooks that echo payment metadata. Require **fraud scoring** latency budget and **chargeback** evidence retention.

## Suggested `architectureRequest` JSON (paste into your client / archlucid.json scaffold)

```json
{
  "requestId": "REPLACE_WITH_HEX32",
  "systemName": "HarborOneCheckout",
  "environment": "production",
  "cloudProvider": "Azure",
  "description": "HarborOne omnichannel checkout \u2014 PCI-DSS CDE segmentation and tokenized payments.",
  "constraints": [
    "CDE isolated subnets with deny-by-default east-west",
    "No PAN in logs or partner webhooks"
  ],
  "requiredCapabilities": [
    "Payment intents with idempotent finalize",
    "ASV-scoped perimeter documented"
  ],
  "assumptions": [
    "PSP provides network tokens",
    "Stores use hardened POS agents"
  ],
  "inlineRequirements": [
    "Fraud scoring p99 under 120ms",
    "Chargeback evidence retention policy explicit"
  ],
  "policyReferences": [
    "PCI-DSS-4.0-CDE"
  ],
  "topologyHints": [
    "Tokenize before analytics lakes",
    "Async checkout with outbox pattern"
  ],
  "securityBaselineHints": [
    "Quarterly segmentation tests as code",
    "HSM-backed key ops for PAN operations"
  ]
}
```
