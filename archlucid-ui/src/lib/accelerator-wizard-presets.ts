import type { WizardFormValues } from "@/lib/wizard-schema";

/** Starter proof pack ids surfaced by the operator-home accelerator chooser (TB-114). */
export const ACCELERATOR_PACK_IDS = [
  "regulated-saas-soc-procurement",
  "ai-llm-workload",
  "azure-cost-governance",
  "healthcare-data-workflow",
] as const;

export type AcceleratorPackId = (typeof ACCELERATOR_PACK_IDS)[number];

const ACCELERATOR_PACK_ID_SET = new Set<string>(ACCELERATOR_PACK_IDS);

export function isAcceleratorPackId(value: string | null | undefined): value is AcceleratorPackId {
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return ACCELERATOR_PACK_ID_SET.has(trimmed);
}

/**
 * Wizard field overrides aligned to starter-proof-packs architecture-request.json sources in templates/.
 * Keeps pack metadata in-repo without bundling JSON at runtime.
 */
export const ACCELERATOR_WIZARD_PRESETS: Readonly<Record<AcceleratorPackId, Partial<WizardFormValues>>> = {
  "regulated-saas-soc-procurement": {
    systemName: "Fabrikam.WorkforceCloud.Api",
    environment: "prod",
    description:
      "Fabrikam (fictional) sells workforce analytics SaaS on Azure: multi-tenant API, background jobs, admin portal; buyers require SOC2-oriented diligence on access, change management, and subprocessors without exposing another customer's data.",
    constraints: [
      "Tenant isolation: no cross-tenant reads in the OLTP path; defense in depth for support break-glass",
      "CI/CD: production deploys from signed builds only; manual approval for schema migrations",
      "Secrets via Key Vault + managed identity; no long-lived keys in app settings for production",
    ],
    requiredCapabilities: ["public-api", "async-workers", "admin-bff", "tenant-isolation-boundary"],
    assumptions: [
      "Greenfield service — illustrative only for pilot evaluation",
      "Entra ID is IdP for workforce customers (OIDC); no legacy SAML in this starter",
    ],
    inlineRequirements: [
      "Architecture review should surface evidence paths for change tickets, access reviews, and logging retention — as design hooks, not as proof of operating effectiveness",
      "Vendor questionnaire mapping: logical access (CC6), change management (CC8) — narrative alignment only",
    ],
    policyReferences: ["starter:regulated-saas-soc"],
  },
  "ai-llm-workload": {
    systemName: "Northwind.Copilot.RagPlatform",
    environment: "prod",
    description:
      "Northwind Traders (fictional) ships an internal copilot over corporate docs: Azure API Management in front of Azure OpenAI chat completion, RAG from Azure AI Search with private endpoints, optional tool-calling to a line-of-business API, and redacted audit logging — buyers ask about data residency, content safety hooks, and who can change system prompts.",
    constraints: [
      "All inference and search data planes use private connectivity from the application VNet; no public Azure OpenAI keys in clients",
      "System prompts and tool manifests change only through approved pipeline; emergency rollback path documented",
      "PII and secrets must not appear in vector index — ingestion pipeline enforces redaction patterns (design intent)",
    ],
    requiredCapabilities: [
      "api-management-gateway",
      "chat-orchestration-worker",
      "rag-retrieval-service",
      "embedding-pipeline",
      "content-safety-wrapper",
    ],
    assumptions: [
      "Synthetic documents only in pilot starter; production would add data classification and DLP",
      "Single Entra ID tenant for workforce users; customer-facing B2C is out of scope for this file",
    ],
    inlineRequirements: [
      "Review should surface human-in-the-loop points for high-impact actions and where grounding is asserted vs. where the model may speculate — no accuracy guarantees",
      "Call out subprocessors: Azure OpenAI, AI Search, and any third-party eval tools as architecture dependencies only",
    ],
    policyReferences: ["starter:ai-llm-workload", "assign-vertical-pack:ai-llm"],
    topologyHints: [
      "Hub-spoke or landing-zone spoke hosting APIM and orchestration; Azure OpenAI and AI Search in locked-down spoke",
      "Optional Functions or Container Apps for embedding batch and index refresh",
    ],
    securityBaselineHints: [
      "Content filtering and abuse monitoring at gateway (design intent)",
      "Key Vault for credentials; managed identity from compute to Azure AI resources",
    ],
  },
  "azure-cost-governance": {
    systemName: "WideWorldImporters.FinOps.LandingZone",
    environment: "prod",
    description:
      "Wide World Importers (fictional) runs multi-subscription Azure landing zones with shared hub networking, workload spokes, and a FinOps review ask: tag governance, budget alerts, reserved instance posture, and Azure Policy sets for encryption and public network restrictions.",
    constraints: [
      "Deny public IPs on sensitive PaaS via policy at landing zone scope (design intent)",
      "Mandatory resource tags: cost-center, environment, workload-owner before production promotion",
      "Hub egress through firewall; spoke-to-spoke via hub (illustrative)",
    ],
    requiredCapabilities: [
      "hub-vnet-firewall",
      "spoke-app-landing",
      "spoke-data-landing",
      "cost-export-automation-account",
    ],
    assumptions: [
      "Single Entra ID tenant; management group hierarchy already exists for pilot story",
      "No third-party FinOps tool in scope — Azure-native exports only in this starter",
    ],
    inlineRequirements: [
      "Review should highlight observability for cost anomalies and governance drift (tags, location) without asserting measured savings",
      "Call out FinOps maturity as design hooks: budgets, anomaly detection, RI/SP posture — not dollar outcomes",
    ],
    policyReferences: ["starter:azure-cost-governance"],
  },
  "healthcare-data-workflow": {
    systemName: "Contoso.Clinical.DataHub",
    environment: "prod",
    description:
      "Contoso Clinical (fictional) ingests HL7v2 and FHIR messages into an Azure analytics hub: ingestion Function Apps, validation, de-identified analytics lake, and a restricted clinical reporting API — PHI must stay in a segmented VNet with audit trails.",
    constraints: [
      "No PHI in public internet paths; reporting API only over private link or front door with mTLS and IP allow lists for pilot narrative",
      "Immutable audit logs for ingestion and configuration changes (design intent — verify in your environment)",
      "Separate projects or subscriptions for dev/test vs prod-like data classes",
    ],
    requiredCapabilities: [
      "ingestion-functions",
      "validation-service",
      "lake-writer",
      "reporting-api",
      "breakglass-support-console",
    ],
    assumptions: [
      "Synthetic messages only in this starter; production would use hardened key management and DLP",
      "Identity: Entra ID with role separation for engineers vs clinical analysts",
    ],
    inlineRequirements: [
      "Review artifacts should call out data lineage from ingest → lake → reporting and where de-identification is asserted (design-level only)",
    ],
    policyReferences: ["starter:healthcare-data-workflow"],
  },
};

export function buildAcceleratorReviewStartHref(packId: AcceleratorPackId, baselineFirst: boolean = true): string {
  const params = new URLSearchParams();

  if (baselineFirst) {
    params.set("baseline", "1");
  }

  params.set("accelerator", packId);

  return "/reviews/new?" + params.toString();
}

export function resolveAcceleratorWizardPreset(
  packId: string | null | undefined,
): Partial<WizardFormValues> | null {
  if (!isAcceleratorPackId(packId)) {
    return null;
  }

  return ACCELERATOR_WIZARD_PRESETS[packId];
}
