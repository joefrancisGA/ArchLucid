/**
 * Customer-visible in-app documentation registry entries (operator).
 * Source of truth: `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`.
 */
import type { ProductDocumentationRegistryInput } from "./product-documentation-registry-types";

export const PRODUCT_DOCUMENTATION_REGISTRY_ENTRIES_OPERATOR_INTEGRATIONS: readonly ProductDocumentationRegistryInput[] = [
  {
    "slug": "cloud-connections",
    "title": "Cloud connections",
    "summary": "Optional Azure, AWS, and GCP connections for read-only evidence — or evidence-only reviews without any connector.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/CLOUD_CONNECTIONS.md",
    ],
    "sectionAnchors": [
      "choose-your-cloud-platform",
      "related-topics",
    ],
    "includeIntroWithSections": true,
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "optional cloud evidence connectors",
  },
  {
    "slug": "cloud-connections-azure",
    "title": "Connect Azure securely",
    "summary": "Workload identity federation, read-only Azure roles, subscription scope, and connection validation — without long-lived secrets.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/CLOUD_CONNECTIONS.md",
    ],
    "sectionAnchors": [
      "connect-azure-securely",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "optional cloud evidence connectors",
  },
  {
    "slug": "cloud-connections-aws",
    "title": "Connect AWS securely",
    "summary": "OIDC-federated read-only IAM role, Resource Explorer inventory, and connection validation — without long-lived access keys.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/CLOUD_CONNECTIONS.md",
    ],
    "sectionAnchors": [
      "connect-aws-securely",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "optional cloud evidence connectors",
  },
  {
    "slug": "cloud-connections-gcp",
    "title": "Connect GCP securely",
    "summary": "Workload Identity Federation, Cloud Asset Viewer, project scope, and connection validation — without service-account JSON keys.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/CLOUD_CONNECTIONS.md",
    ],
    "sectionAnchors": [
      "connect-gcp-securely",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "optional cloud evidence connectors (GCP Workload Identity Federation connector)",
  },
  {
    "slug": "azure-permissions",
    "title": "Azure permissions for cloud connections",
    "summary": "Grant ArchLucid the minimum read-only Azure roles, scopes, and verification steps for hosted cloud connections.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/AZURE_CLOUD_CONNECTION_PERMISSIONS.md",
    ],
    "pdfStatus": "customer",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "optional cloud evidence connectors",
  },
  {
    "slug": "integration-readiness",
    "title": "Integration readiness",
    "summary": "Understand ready, recommended, and optional notification, ticketing, publishing, and delivery integrations for your workspace.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/INTEGRATION_READINESS.md",
    ],
  },
  {
    "slug": "azure-boards",
    "title": "Azure Boards integration",
    "summary": "Connect Azure DevOps for work item creation from ArchLucid findings — independent of your architecture cloud provider.",
    "audience": "operator",
    "sourcePaths": [
      "docs/library/customer-facing/AZURE_BOARDS_INTEGRATION.md",
    ],
    "pdfStatus": "public",
    "lastReviewed": "2026-08-09",
    "releaseApplicability": "Azure Boards work item connector",
  },
  {
    "slug": "connection-status",
    "title": "Connection status",
    "summary": "Workspace integration readiness tiles and connector follow-up surfaces.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-12",
    "releaseApplicability": "administration connection status orientation",
  },
  {
    "slug": "slack-integration",
    "title": "Slack notifications",
    "summary": "Configure Slack incoming webhook destinations for alert delivery.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "integrations slack notifications orientation",
  },
  {
    "slug": "teams-integration",
    "title": "Microsoft Teams notifications",
    "summary": "Configure Microsoft Teams channel destinations for alert delivery.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "integrations teams notifications orientation",
  },
  {
    "slug": "webhooks-integration",
    "title": "Webhooks",
    "summary": "Configure HTTPS webhook subscriptions for alert delivery.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "integrations webhooks orientation",
  },
  {
    "slug": "jira-integration",
    "title": "Jira integration",
    "summary": "Outbound Jira work-item routing, connection health, and workspace mapping settings.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "integrations jira orientation",
  },
  {
    "slug": "servicenow-integration",
    "title": "ServiceNow integration",
    "summary": "Outbound ServiceNow incident routing, CMDB behavior, and connection health.",
    "audience": "operator",
    "sourcePaths": [
    ],
    "lastReviewed": "2026-08-13",
    "releaseApplicability": "Integrations · ServiceNow orientation",
  },
] as const;
