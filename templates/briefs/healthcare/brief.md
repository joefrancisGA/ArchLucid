<!--
Vertical: healthcare -- Time to first commit (estimated): 40 minutes
-->
# Brief: Meridian Care Coordination FHIR Hub (Azure)

Design **Meridian Care Coordination FHIR Hub** on **Azure** for **staging** rollout connecting two hospitals and affiliated clinics. **Topology:** FHIR APIs behind API Management; eventing through Event Hubs for ADT feeds; PHI stays in region-paired storage with customer-managed keys. No PHI in public CDN or third-party APM without BAA. **Cost:** cap non-prod spend at **$9,500/month** using dev/test pricing, burstable SQL where appropriate, and autoscale caps on integration workers. **Compliance (HIPAA):** enforce **minimum necessary** scopes per client credential, field-level security labels on resources, and comprehensive **audit** of read/write including break-glass. **Critic:** hunt for data flows that copy MRNs into logs, shadow AI features without consent tracking, or cross-tenant reuse of integration accounts. Demand explicit **consent** and **purpose of use** metadata on bulk exports.

## Suggested `architectureRequest` JSON (paste into your client / archlucid.json scaffold)

```json
{
  "requestId": "REPLACE_WITH_HEX32",
  "systemName": "MeridianFhirHub",
  "environment": "staging",
  "cloudProvider": "Azure",
  "description": "Meridian Care Coordination FHIR Hub \u2014 HIPAA minimum necessary and regional PHI residency.",
  "constraints": [
    "No PHI in public CDN or third-party APM without BAA",
    "Customer-managed keys for PHI stores"
  ],
  "requiredCapabilities": [
    "FHIR R4 compliant APIs",
    "Field-level security labels",
    "ADT event ingestion with ordering"
  ],
  "assumptions": [
    "Two hospital IDs onboarded first wave",
    "Identity from Entra ID with clinical roles"
  ],
  "inlineRequirements": [
    "Consent and purpose-of-use on bulk export",
    "Break-glass reads fully audited"
  ],
  "policyReferences": [
    "HIPAA-Security-164.312"
  ],
  "topologyHints": [
    "API Management as sole external ingress",
    "PHI subnets isolated from dev tools"
  ],
  "securityBaselineHints": [
    "Minimum necessary scopes per client credential",
    "No MRNs in application logs"
  ]
}
```
