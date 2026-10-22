<!--
Vertical: public-sector-us -- Time to first commit (estimated): 38 minutes
-->
# Brief: Cascade State Benefits Eligibility Service (Azure Government, US)

**Cascade State Benefits Eligibility Service** is a US state government workload running on **Azure Government (US Gov Virginia + US Gov Texas)** that handles citizen benefits eligibility decisions, with **PII** flowing through controlled enclaves and **moderate-impact** data flows scoped for **FedRAMP Moderate** (state agency targeting **StateRAMP Moderate**). **Topology:** zero-trust ingress through Azure Front Door (Gov), private endpoints for SQL and storage, no public egress from data planes. **Cost:** predictable spend under **$14,000/month** with reserved instances for baseline APIs and CMK-required storage classes. **Compliance (FedRAMP Moderate / NIST SP 800-53 Rev. 5):** AC-2/AC-3 (account management + access enforcement), AU-2/AU-12 (audit events + audit generation), SC-7 (boundary protection), SC-8/SC-13 (transmission confidentiality + cryptographic protection), SI-4 (system monitoring). **Critic:** challenge any failover that moves data outside US sovereign boundaries (must stay in Azure Gov regions only), unauthenticated public endpoints, or shared-tenancy storage that could leak across agency lines. Document **authority to operate (ATO) boundary** and **continuous monitoring (ConMon)** posture explicitly. **Out of scope for v1:** CJIS Security Policy overlay for criminal-justice information — see [`docs/PENDING_QUESTIONS.md`](../../../docs/PENDING_QUESTIONS.md) item **17** sub-bullet "CJIS overlay" for the deferred-to-future-vertical-pack note.

## Suggested `architectureRequest` JSON (paste into your client / archlucid.json scaffold)

```json
{
  "requestId": "REPLACE_WITH_HEX32",
  "systemName": "CascadeBenefitsEligibilityService",
  "environment": "production",
  "cloudProvider": "Azure",
  "description": "Cascade State benefits eligibility service \u2014 FedRAMP Moderate / StateRAMP Moderate baseline.",
  "constraints": [
    "Data residency Azure Government regions only (US Gov Virginia + US Gov Texas)",
    "No commercial-cloud failover that moves citizen data",
    "Private endpoints required for SQL and Blob; no public data-plane egress"
  ],
  "requiredCapabilities": [
    "FIPS 140-3 validated cryptography on all data-plane TLS",
    "Customer-managed keys (CMK) for any storage holding PII",
    "Continuous monitoring (ConMon) telemetry feed to agency SOC",
    "Authority to operate (ATO) boundary documented in the manifest"
  ],
  "assumptions": [
    "Identity from Entra ID Government (CAC / PIV-aware) for agency staff",
    "Workload handles eligibility PII only; criminal-justice information is out of scope (CJIS overlay deferred to a future pack)"
  ],
  "inlineRequirements": [
    "Audit retention 3 years minimum (FedRAMP Moderate AU-11)",
    "Incident response notification within 1 hour of confirmed impact",
    "Vulnerability scans monthly; high-severity remediation within 30 days"
  ],
  "policyReferences": [
    "FedRAMP-Moderate-Rev5",
    "NIST-SP-800-53-Rev5-AC-2",
    "NIST-SP-800-53-Rev5-AU-2",
    "NIST-SP-800-53-Rev5-SC-7",
    "NIST-SP-800-53-Rev5-SC-8"
  ],
  "topologyHints": [
    "Zero-trust ingress through Azure Front Door (Gov)",
    "Boundary protection per SC-7 \u2014 no shared egress with non-government workloads",
    "Sovereign workload isolation \u2014 no Azure commercial regions in failover plan"
  ],
  "securityBaselineHints": [
    "Privileged actions (PE-2 equivalent) emit dedicated audit events",
    "Configuration drift detection (CM-3) wired into release pipeline",
    "PII identifiers tokenized before SIEM ingest"
  ]
}
```
