<!--
Vertical: public-sector -- Time to first commit (estimated): 38 minutes
-->
# Brief: Baltic Citizen Services Gateway (Azure, EU)

**Baltic Citizen Services Gateway** is an EU-facing digital service on **Azure** (West Europe pair) handling non-sensitive citizen requests with occasional **special category** data in segregated modules. **Topology:** zero-trust ingress, regional data residency, offline-capable field kiosks syncing through controlled queues. **Cost:** prioritize **predictable** spend under **$10,500/month** with reserved instances for baseline APIs and strict caps on premium observability add-ons. **Compliance (GDPR):** DPIA-linked data minimization, **Art. 32** measures evidenced in architecture (encryption, resilience), DSR automation hooks, and logging that avoids excessive profiling. **Critic:** challenge US-region failover that would move EU data, opaque scoring that lacks explainability, or vendor lock-in that blocks sovereign portability. Document **legal basis** per dataset and **retention** clocks.

## Suggested `architectureRequest` JSON (paste into your client / archlucid.json scaffold)

```json
{
  "requestId": "REPLACE_WITH_HEX32",
  "systemName": "BalticCitizenGateway",
  "environment": "production",
  "cloudProvider": "Azure",
  "description": "Baltic EU citizen services gateway \u2014 GDPR Art.32 and DPIA-driven minimization.",
  "constraints": [
    "Data residency EU West pair only",
    "No US-region failover that moves EU citizen data"
  ],
  "requiredCapabilities": [
    "DSR automation hooks",
    "Legal basis metadata per dataset",
    "Offline kiosk sync with audit"
  ],
  "assumptions": [
    "National eID for strong auth",
    "Special category data isolated modules"
  ],
  "inlineRequirements": [
    "Explainability for any scoring",
    "Retention clocks enforced in data plane"
  ],
  "policyReferences": [
    "GDPR-Art32",
    "GDPR-Art5-Minimization"
  ],
  "topologyHints": [
    "Zero-trust ingress",
    "Sovereign portability for exit scenarios"
  ],
  "securityBaselineHints": [
    "Logging avoids excessive profiling",
    "DPIA identifiers on sensitive flows"
  ]
}
```
