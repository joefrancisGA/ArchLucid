/** Retail Order Management sample (same narrative as documentation presets). */
export const CONTOSO_RETAIL_SAMPLE_BRIEF =
  "Assess a lift-and-shift and selective replatform of the Order Management (Retail) 3-tier web application from on-premises datacenters to Azure. Current state: IIS / .NET workloads, SQL Server on-prem clustering, Redis-like session/cache tier, file shares for batch drops. Target: Azure App Service (Linux or Windows containers) for web and API tiers, Azure SQL Database (Business Critical or General Purpose with zone redundancy where approved), Azure Cache for Redis for session/cache, private connectivity via Virtual Network integration and Private Link to PaaS. Business requires 99.95% availability for the storefront path during cutover windows, predictable monthly spend under stakeholder-approved limits, GDPR-aligned retention for EU customer subsets, baseline PCI-DSS segmentation for payment-adjacent components, TLS 1.2+ everywhere, encryption at rest for SQL and Redis, centralized secrets in Key Vault, and auditable deployment and change records.";

export type QuickReviewSampleBrief = {
  readonly id: string;
  readonly label: string;
  readonly vertical: string;
  readonly brief: string;
};

export const QUICK_REVIEW_SAMPLE_BRIEFS: readonly QuickReviewSampleBrief[] = [
  {
    id: "retail",
    label: "Retail",
    vertical: "Retail",
    brief: CONTOSO_RETAIL_SAMPLE_BRIEF,
  },
  {
    id: "healthcare",
    label: "Healthcare",
    vertical: "Healthcare",
    brief:
      "Assess modernization of a Northstar Health member intake and claims-adjacent workflow from legacy on-premises systems to Azure. Current state: HL7/FHIR adapters, SQL Server clinical data store, manual PHI review queues, and batch eligibility checks. Target: Azure API Management for partner ingress, App Service for intake APIs, Azure SQL with column encryption for PHI subsets, Private Link to PaaS, Key Vault for secrets, and auditable change records for HIPAA-aligned retention. Business requires least-privilege access, explicit PHI classification at ingress, 99.9% availability for intake during open enrollment, EU residency for selected member cohorts, and sponsor-ready evidence for security review.",
  },
  {
    id: "financial",
    label: "Financial",
    vertical: "Financial services",
    brief:
      "Document a Silverline Capital trading-adjacent reporting platform migration to Azure. Current state: on-prem Windows services, SQL Server reporting warehouse, file-based market data drops, and manual reconciliation. Target: Azure Container Apps for ingestion workers, Azure SQL for curated reporting schema, Event Hubs for market tick buffering, Redis for session-scoped dashboards, and PCI-scoped network segmentation for payment-adjacent components. Constraints include sub-minute freshness for intraday risk summaries, encryption in transit and at rest, centralized identity via Entra ID, and durable audit trails for regulatory inquiries.",
  },
  {
    id: "saas",
    label: "SaaS",
    vertical: "SaaS",
    brief:
      "Review Nuvola SaaS multi-tenant B2B platform scale-out on Azure. Current state: single-region App Service, shared SQL database, Redis cache, and per-tenant configuration in application tables. Target: zone-redundant App Service, elastic pools with tenant-aware routing, Azure Cache for Redis, Cosmos DB for high-churn tenant metadata, and API Management for partner integrations. Goals include predictable per-tenant cost isolation, 99.95% API availability, GDPR-aligned data export, and architecture evidence suitable for enterprise security questionnaires.",
  },
  {
    id: "logistics",
    label: "Logistics",
    vertical: "Logistics",
    brief:
      "Assess Meridian Logistics real-time shipment tracking modernization. Current state: on-prem message brokers, SQL operational store, and mobile gateway with intermittent connectivity. Target: Azure IoT Hub for device ingress, Event Hubs for telemetry streams, Azure Functions for enrichment, Azure SQL for operational truth, and Power BI embedded summaries for operations leadership. Requirements include geofenced alerts, idempotent event processing, cold-path archival to Blob Storage, and clear disaster recovery with replay-from-journal semantics.",
  },
];

export const QUICK_REVIEW_DEMO_DEFAULT_BRIEF_ID = "healthcare";

export function findQuickReviewSampleBrief(id: string): QuickReviewSampleBrief | null {
  const match = QUICK_REVIEW_SAMPLE_BRIEFS.find((row) => row.id === id);

  return match ?? null;
}

export function defaultQuickReviewSampleBriefId(demoMode: boolean, tourActive: boolean = false): string {
  if (demoMode || tourActive) {
    return QUICK_REVIEW_DEMO_DEFAULT_BRIEF_ID;
  }

  return "retail";
}
