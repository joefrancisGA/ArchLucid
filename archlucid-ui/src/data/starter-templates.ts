import type { WizardPreset } from "@/lib/wizard-presets";

/**
 * Reference starters for common enterprise footprints — surfaced on the first wizard step
 * (distinct from Quick shapes / industry verticals).
 */
export const starterArchitectureTemplates: WizardPreset[] = [
  {
    id: "starter-api-platform-b2b",
    label: "API platform (B2B)",
    description: "Partner-facing REST/GraphQL platform with OAuth, rate limits, and multi-tenant isolation.",
    values: {
      systemName: "PartnerApiPlatform",
      description:
        "B2B API platform exposing curated REST endpoints to external partners with OAuth client credentials, per-tenant rate limits, private connectivity options, and audit logging suitable for SOC2-minded buyers.",
      constraints: ["Partner isolation boundary", "No PII in URL paths", "Azure-native identity"],
      requiredCapabilities: ["OAuth 2.0 / client credentials", "Per-tenant quotas", "Centralized audit trail"],
      topologyHints: ["Separate data store per tenant tier where required", "Edge WAF with OWASP baseline"],
    },
  },
  {
    id: "starter-internal-operations-portal",
    label: "Internal operations portal",
    description: "Authenticated intranet workload with batch integrations and role-based access.",
    values: {
      systemName: "InternalOpsPortal",
      description:
        "Internal-only operations console for support and fulfillment teams with Entra ID authentication, granular RBAC, CSV exports, and synchronous integrations to ERP staging APIs.",
      constraints: ["Entra ID SSO mandatory", "No public anonymous endpoints"],
      requiredCapabilities: ["RBAC aligned to Entra groups", "Audited admin actions", "Export job queue"],
      securityBaselineHints: ["Conditional Access for admin roles", "Secrets only via Key Vault references"],
    },
  },
  {
    id: "starter-iot-telemetry-ingest",
    label: "IoT telemetry ingest",
    description: "High-volume device telemetry through Event Hubs into a curated lakehouse path.",
    values: {
      systemName: "DeviceTelemetryHub",
      description:
        "Millions of constrained devices send JSON telemetry through MQTT or HTTPS gateways into Event Hubs, with stream validation, schema evolution, and near-real-time dashboards for operations.",
      constraints: ["At-least-once delivery with dedupe keys", "Regional data residency for EU devices"],
      requiredCapabilities: ["Azure Event Hubs", "Schema/version registry", "Cold + hot storage tiers"],
      topologyHints: ["Partition by device cohort to contain noisy neighbors", "Back-pressure on ingest workers"],
    },
  },
  {
    id: "starter-payment-adjacent-not-chd",
    label: "Payments-adjacent (no card data)",
    description: "Checkout orchestration touching tokenized payments only — no raw CHD in scope.",
    values: {
      systemName: "CheckoutOrchestration",
      description:
        "Customer checkout orchestration integrating a PCI-DSS certified payment provider via hosted fields/token APIs only; ArchLucid scope excludes raw cardholder data and focuses on service boundaries, webhook integrity, and settlement reconciliation jobs.",
      constraints: ["No CHD persistence in our services", "Webhook signature verification mandatory"],
      requiredCapabilities: ["PSP-hosted capture", "Idempotent order APIs", "Settlement reconciliation reports"],
      securityBaselineHints: ["mTLS or signed webhooks for PSP callbacks", "Immutable audit for money movement events"],
    },
  },
];
