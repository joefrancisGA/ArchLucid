<!--
Vertical: saas -- Time to first commit (estimated): 30 minutes
-->
# Brief: OrbitStack Multi-Tenant Control Plane (Azure)

**OrbitStack** delivers a **SOC 2**-aligned multi-tenant SaaS control plane on **Azure** in **staging** for design partners. **Topology:** shard-aware routing, per-tenant encryption boundaries, no cross-tenant background workers without explicit job tokens. **Cost:** keep MVP footprint under **$7,500/month** with serverless schedulers, aggressive cold storage for backups, and capped LLM spend per tenant. **Compliance (SOC 2 CC):** logical access tied to HR status, vendor inventory for subprocessors, change tickets for infra modules. **Critic:** expose weak spots—shared secrets across tenants, missing SCIM deprovision hooks, or admin APIs without step-up MFA. Require **tenant isolation tests** in CI and documented **customer data deletion** SLAs.

## Suggested `architectureRequest` JSON (paste into your client / archlucid.json scaffold)

```json
{
  "requestId": "REPLACE_WITH_HEX32",
  "systemName": "OrbitStackControlPlane",
  "environment": "staging",
  "cloudProvider": "Azure",
  "description": "OrbitStack multi-tenant SaaS control plane \u2014 SOC 2 aligned MVP for design partners.",
  "constraints": [
    "Per-tenant encryption boundaries",
    "No cross-tenant workers without signed job tokens"
  ],
  "requiredCapabilities": [
    "SCIM deprovision hooks",
    "Per-tenant LLM spend caps",
    "Tenant isolation tests in CI"
  ],
  "assumptions": [
    "Stripe metering for usage billing",
    "Entra B2B for admin access"
  ],
  "inlineRequirements": [
    "Customer data deletion SLA 30 days",
    "Step-up MFA on admin APIs"
  ],
  "policyReferences": [
    "SOC2-CC6-Logical-Access"
  ],
  "topologyHints": [
    "Shard-aware routing layer",
    "Separate observability per tenant tier"
  ],
  "securityBaselineHints": [
    "Vendor inventory for subprocessors",
    "Change tickets for infra modules"
  ]
}
```
