<!--
Vertical: financial-services -- Time to first commit (estimated): 35 minutes
-->
# Brief: NorthRiver Core Banking API (Azure)

You are architecting **NorthRiver Core Banking API**, a read-mostly account and payment inquiry surface that sits behind the bank's mobile app and partner channels. The workload runs on **Azure** in a **production**-adjacent **staging** slice first, with strict segregation from the legacy mainframe adapters. **Topology:** expose only stateless BFFs and tokenized APIs to the internet; all ledger mutations remain on the mainframe bridge via a narrow, idempotent command channel. Prefer **hub-and-spoke** integration: one enterprise service bus namespace per region, dead-letter analytics on partner traffic, and circuit breakers on every hop to the core. **Cost:** keep steady-state under **$18,000/month** for non-prod+staging combined by rightsizing App Service / AKS node pools, using reserved capacity for baseline CPUs, and tiering observability (hot logs 7d, archive 400d). **Compliance (GLBA + SOX):** GLBA demands clear **financial privacy** notices and purpose limitation on customer-identifying fields—model PII tags in manifests and deny accidental fan-out to analytics lakes. SOX-style ITGC expects **segregation of duties** between deployers and approvers, immutable audit trails for parameter changes, and evidence that access reviews occurred. **Critic agent stress:** challenge any design that co-locates PCI-adjacent token vaults with marketing clickstreams, or that omits break-glass access paths for ops. Require explicit **failure modes** when the entitlement service is unavailable (fail closed vs read-only degraded) and document blast radius per partner. Surface **latency SLOs** (p95 < 250ms read) and **RPO/RTO** for regional outage.

## Suggested `architectureRequest` JSON (paste into your client / archlucid.json scaffold)

```json
{
  "requestId": "REPLACE_WITH_HEX32",
  "systemName": "NorthRiverCoreBankingApi",
  "environment": "staging",
  "cloudProvider": "Azure",
  "description": "NorthRiver Core Banking API \u2014 GLBA/SOX aligned read path with mainframe bridge; see brief prose above.",
  "constraints": [
    "Azure primary region only for PHI-adjacent metadata",
    "Monthly non-prod+staging spend under 18000 USD"
  ],
  "requiredCapabilities": [
    "Tokenized partner APIs",
    "Tamper-evident audit pipeline",
    "Regional DR with tested restore"
  ],
  "assumptions": [
    "Mainframe remains system of record for balances",
    "Partners present OAuth2 client credentials"
  ],
  "inlineRequirements": [
    "p95 read latency under 250ms",
    "Fail-closed when entitlement service unavailable"
  ],
  "policyReferences": [
    "GLBA-Privacy-201",
    "SOX-ITGC-Material-Systems"
  ],
  "topologyHints": [
    "Hub-and-spoke integration per region",
    "No co-tenancy of CDE token vault with marketing analytics"
  ],
  "securityBaselineHints": [
    "Immutable audit for parameter changes",
    "Break-glass access with ticket correlation"
  ]
}
```
