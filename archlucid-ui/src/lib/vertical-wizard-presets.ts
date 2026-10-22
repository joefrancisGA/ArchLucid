import type { WizardPreset } from "@/lib/wizard-presets";
import type { WizardFormValues } from "@/lib/wizard-schema";

/**
 * First-run wizard presets aligned to repo `templates/briefs/{vertical}/brief.md` starters (Prompt 11).
 * Values merge over `buildDefaultWizardValues()` so `requestId` and empty collections stay valid.
 */
export const verticalBriefWizardPresets: WizardPreset[] = [
  {
    id: "vertical-financial-services",
    label: "Financial services",
    description:
      "GLBA and SOX starter for regulated APIs, mainframe integration, and segregation of duties.",
    values: financialVerticalValues(),
  },
  {
    id: "vertical-healthcare",
    label: "Healthcare",
    description:
      "HIPAA starter for claims, eligibility, care management, PHI minimization, auditability, and break-glass access.",
    values: healthcareVerticalValues(),
  },
  {
    id: "vertical-retail",
    label: "Retail / payments",
    description: "PCI-DSS starter — CDE segmentation, tokenization, fraud and chargeback evidence.",
    values: retailVerticalValues(),
  },
  {
    id: "vertical-saas",
    label: "SaaS / B2B",
    description: "SOC 2 starter — tenant isolation, SCIM, subprocessors, admin MFA.",
    values: saasVerticalValues(),
  },
  {
    id: "vertical-public-sector",
    label: "Public sector \u2014 EU (GDPR)",
    description: "GDPR-first citizen gateway — residency, DSR, DPIA, no US failover for EU data.",
    values: publicSectorVerticalValues(),
  },
  {
    id: "vertical-public-sector-us",
    label: "Public sector \u2014 US (FedRAMP / StateRAMP)",
    description: "Azure Government workload — FedRAMP Moderate / StateRAMP baseline, NIST SP 800-53 Rev. 5.",
    values: publicSectorUsVerticalValues(),
  },
];

function financialVerticalValues(): Partial<WizardFormValues> {
  return {
    systemName: "NorthRiverCoreBankingApi",
    environment: "staging",
    description:
      "NorthRiver Core Banking API on Azure: read-mostly inquiry surface behind mobile and partners; tokenized BFFs, mainframe bridge, hub-and-spoke integration, GLBA/SOX, under $18k/mo non-prod+staging.",
    constraints: [
      "Azure primary region only for PHI-adjacent metadata",
      "Monthly non-prod+staging spend under 18000 USD",
    ],
    requiredCapabilities: [
      "Tokenized partner APIs",
      "Tamper-evident audit pipeline",
      "Regional DR with tested restore",
    ],
    assumptions: [
      "Mainframe remains system of record for balances",
      "Partners present OAuth2 client credentials",
    ],
    inlineRequirements: [
      "p95 read latency under 250ms",
      "Fail-closed when entitlement service unavailable",
    ],
    policyReferences: ["GLBA-Privacy-201", "SOX-ITGC-Material-Systems"],
    topologyHints: [
      "Hub-and-spoke integration per region",
      "No co-tenancy of CDE token vault with marketing analytics",
    ],
    securityBaselineHints: [
      "Immutable audit for parameter changes",
      "Break-glass access with ticket correlation",
    ],
  };
}

function healthcareVerticalValues(): Partial<WizardFormValues> {
  return {
    systemName: "MeridianFhirHub",
    environment: "staging",
    description:
      "Meridian Care Coordination FHIR Hub on Azure: two hospitals, API Management ingress, Event Hubs ADT, HIPAA minimum necessary, PHI in region-paired CMK storage, under $9.5k/mo non-prod.",
    constraints: ["No PHI in public CDN or third-party APM without BAA", "Customer-managed keys for PHI stores"],
    requiredCapabilities: ["FHIR R4 compliant APIs", "Field-level security labels", "ADT event ingestion with ordering"],
    assumptions: ["Two hospital IDs onboarded first wave", "Identity from Entra ID with clinical roles"],
    inlineRequirements: ["Consent and purpose-of-use on bulk export", "Break-glass reads fully audited"],
    policyReferences: ["HIPAA-Security-164.312"],
    topologyHints: ["API Management as sole external ingress", "PHI subnets isolated from dev tools"],
    securityBaselineHints: ["Minimum necessary scopes per client credential", "No MRNs in application logs"],
  };
}

function retailVerticalValues(): Partial<WizardFormValues> {
  return {
    systemName: "HarborOneCheckout",
    environment: "production",
    description:
      "HarborOne omnichannel checkout on Azure: CDE segmentation, tokenization before analytics, async payment intents, PCI-DSS scope, fraud scoring budget, ~$14k/mo envelope.",
    constraints: ["CDE isolated subnets with deny-by-default east-west", "No PAN in logs or partner webhooks"],
    requiredCapabilities: ["Payment intents with idempotent finalize", "ASV-scoped perimeter documented"],
    assumptions: ["PSP provides network tokens", "Stores use hardened POS agents"],
    inlineRequirements: ["Fraud scoring p99 under 120ms", "Chargeback evidence retention policy explicit"],
    policyReferences: ["PCI-DSS-4.0-CDE"],
    topologyHints: ["Tokenize before analytics lakes", "Async checkout with outbox pattern"],
    securityBaselineHints: ["Quarterly segmentation tests as code", "HSM-backed key ops for PAN operations"],
  };
}

function saasVerticalValues(): Partial<WizardFormValues> {
  return {
    systemName: "OrbitStackControlPlane",
    environment: "staging",
    description:
      "OrbitStack multi-tenant SaaS control plane on Azure: SOC 2 aligned MVP, shard-aware routing, per-tenant encryption, SCIM and LLM caps, isolation tests in CI, ~$7.5k/mo footprint.",
    constraints: ["Per-tenant encryption boundaries", "No cross-tenant workers without signed job tokens"],
    requiredCapabilities: ["SCIM deprovision hooks", "Per-tenant LLM spend caps", "Tenant isolation tests in CI"],
    assumptions: ["Stripe metering for usage billing", "Entra B2B for admin access"],
    inlineRequirements: ["Customer data deletion SLA 30 days", "Step-up MFA on admin APIs"],
    policyReferences: ["SOC2-CC6-Logical-Access"],
    topologyHints: ["Shard-aware routing layer", "Separate observability per tenant tier"],
    securityBaselineHints: ["Vendor inventory for subprocessors", "Change tickets for infra modules"],
  };
}

function publicSectorVerticalValues(): Partial<WizardFormValues> {
  return {
    systemName: "BalticCitizenGateway",
    environment: "production",
    description:
      "Baltic EU citizen services gateway on Azure West Europe: GDPR Art.32, DPIA minimization, DSR hooks, no US failover for EU data, offline kiosks, ~$10.5k/mo predictable spend.",
    constraints: ["Data residency EU West pair only", "No US-region failover that moves EU citizen data"],
    requiredCapabilities: ["DSR automation hooks", "Legal basis metadata per dataset", "Offline kiosk sync with audit"],
    assumptions: ["National eID for strong auth", "Special category data isolated modules"],
    inlineRequirements: ["Explainability for any scoring", "Retention clocks enforced in data plane"],
    policyReferences: ["GDPR-Art32", "GDPR-Art5-Minimization"],
    topologyHints: ["Zero-trust ingress", "Sovereign portability for exit scenarios"],
    securityBaselineHints: ["Logging avoids excessive profiling", "DPIA identifiers on sensitive flows"],
  };
}

function publicSectorUsVerticalValues(): Partial<WizardFormValues> {
  return {
    systemName: "CascadeBenefitsEligibilityService",
    environment: "production",
    description:
      "Cascade State benefits eligibility service on Azure Government (US Gov Virginia + US Gov Texas): FedRAMP Moderate / StateRAMP baseline (NIST SP 800-53 Rev. 5); no commercial-cloud failover; ~$14k/mo predictable spend.",
    constraints: [
      "Data residency Azure Government regions only (US Gov Virginia + US Gov Texas)",
      "No commercial-cloud failover that moves citizen data",
      "Private endpoints required for SQL and Blob; no public data-plane egress",
    ],
    requiredCapabilities: [
      "FIPS 140-3 validated cryptography on all data-plane TLS",
      "Customer-managed keys (CMK) for any storage holding PII",
      "Continuous monitoring (ConMon) telemetry feed to agency SOC",
      "Authority to operate (ATO) boundary documented in the manifest",
    ],
    assumptions: [
      "Identity from Entra ID Government (CAC / PIV-aware) for agency staff",
      "Workload handles eligibility PII only; criminal-justice information is out of scope (CJIS overlay deferred to a future pack)",
    ],
    inlineRequirements: [
      "Audit retention 3 years minimum (FedRAMP Moderate AU-11)",
      "Incident response notification within 1 hour of confirmed impact",
      "Vulnerability scans monthly; high-severity remediation within 30 days",
    ],
    policyReferences: [
      "FedRAMP-Moderate-Rev5",
      "NIST-SP-800-53-Rev5-AC-2",
      "NIST-SP-800-53-Rev5-AU-2",
      "NIST-SP-800-53-Rev5-SC-7",
      "NIST-SP-800-53-Rev5-SC-8",
    ],
    topologyHints: [
      "Zero-trust ingress through Azure Front Door (Gov)",
      "Boundary protection per SC-7 \u2014 no shared egress with non-government workloads",
      "Sovereign workload isolation \u2014 no Azure commercial regions in failover plan",
    ],
    securityBaselineHints: [
      "PII identifiers tokenized before SIEM ingest",
      "Privileged actions emit dedicated audit events",
      "Configuration drift detection wired into release pipeline",
    ],
  };
}
