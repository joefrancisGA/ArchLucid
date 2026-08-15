/**
 * Customer-facing copy for `/help/cloud-connections/azure`.
 * Role requirements reuse `azure-cloud-connection-permissions-manifest.ts`.
 */
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECT_AZURE_SECURELY_PAGE_TITLE = "Connect Azure securely";

export const CONNECT_AZURE_SECURELY_PAGE_LEAD =
  "Connecting Azure adds current resource and cost evidence to architecture reviews. The connection is optional — ArchLucid can still review uploaded documents, briefs, and diagrams without cloud access.";

export const CONNECT_AZURE_SECURELY_WITHOUT_CONNECTION_NOTE =
  "Reviews can proceed with briefs, diagrams, documents, and uploaded evidence when you choose not to connect.";

export const CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE = "Where to go next";

export const CONNECT_AZURE_SECURELY_CLAIM_HEADING_ID = "help-cloud-connections-azure-claim-discipline-heading" as const;

export const CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE =
  "This guide orients architects on Azure federated trust and read-only role assignment — open Assurance status or the Cloud connections hub when you need live connector health or assurance cites.";

export const CONNECT_AZURE_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when Azure setup needs the live hub, permissions detail, or assurance cites.";

export type ConnectAzureSecurelySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator diligence index — no self-href to `/help/cloud-connections/azure`. */
export const CONNECT_AZURE_SECURELY_SOURCES: readonly ConnectAzureSecurelySourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Azure permissions guide", href: inAppHelpHref("azure-permissions") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const CONNECT_AZURE_SECURELY_BACK_TO_CONNECTIONS = "Back to cloud connections";

export const CONNECT_AZURE_SECURELY_CONFIGURE_ACTION = "Configure Azure connection";

export const CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK =
  "Assign federated trust and Azure roles (detailed procedure)";

export const CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK = "Azure connection settings";

export const CONNECT_AZURE_SECURELY_SECURITY_HEADING = "Security model";

export const CONNECT_AZURE_SECURELY_SECURITY_ITEMS = [
  {
    id: "federated-auth",
    title: "Federated authentication",
    detail: "ArchLucid authenticates at runtime without retaining a client secret.",
  },
  {
    id: "read-only",
    title: "Read-only Azure access",
    detail:
      "ArchLucid requests only the verified roles needed to collect architecture and optional cost evidence.",
  },
  {
    id: "limited-scope",
    title: "Limited scope",
    detail:
      "Access is assigned only to the subscriptions, management groups, or resource groups selected for the connection.",
  },
  {
    id: "customer-controlled",
    title: "Customer-controlled access",
    detail: "Your Azure administrator can remove the role assignment or federation relationship at any time.",
  },
] as const;

export const CONNECT_AZURE_SECURELY_SETUP_HEADING = "Set up the Azure connection";

export const CONNECT_AZURE_SECURELY_SETUP_STEPS = [
  {
    id: "open-cloud-connections",
    text: "Open Cloud connections and begin an Azure connection.",
  },
  {
    id: "review-roles",
    text: "Review the requested identity, scope, and Azure roles.",
  },
  {
    id: "configure-trust",
    text: "Configure the federated trust and assign the required read-only roles in Azure.",
  },
  {
    id: "enter-ids",
    text: "Enter or confirm the Azure tenant, application, and subscription information requested by ArchLucid.",
  },
  {
    id: "verify",
    text: "Return to ArchLucid and verify the connection.",
  },
] as const;

export const CONNECT_AZURE_SECURELY_ROLES_HEADING = "Azure roles";

export const CONNECT_AZURE_SECURELY_PERMISSIONS_AUTHORITY_NOTE =
  "The Azure permissions guide is the authoritative reference for role assignments, scope limits, collected data categories, and troubleshooting.";

export const CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING = "Do not assign broad write-enabled roles";

export const CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL = "Restricted roles";

export const CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY =
  "ArchLucid does not require Owner, Contributor, User Access Administrator, or tenant-wide directory roles for an Azure cloud connection.";

export const CONNECT_AZURE_SECURELY_RETAINED_ITEMS = [
  "Azure tenant ID",
  "Application or client ID",
  "Selected subscription or management-group scope",
  "Connection status",
  "Last validation time",
] as const;

export const CONNECT_AZURE_SECURELY_CREDENTIALS_ITEMS = [
  "Client secrets",
  "Azure access tokens beyond their required runtime lifecycle",
  "Private keys",
] as const;

export const CONNECT_AZURE_SECURELY_PERMISSIONS_ITEMS = [
  "Owner",
  "Contributor",
  "User Access Administrator",
  "Tenant-wide Global Reader or other broad directory roles",
] as const;

export const CONNECT_AZURE_SECURELY_VERIFICATION_HEADING = "What verification confirms";

export const CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS_LABEL = "Confirmed by connection verification";

export const CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL = "Not confirmed by connection verification";

export const CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS: readonly string[] = [
  "Workload identity federation",
  "Reader access to list subscription resources",
  "Inventory import into the workspace",
];

export const CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY: readonly string[] = [
  "Cost Management Reader assignment",
  "Policy compliance read permissions",
];

export const CONNECT_AZURE_SECURELY_VERIFY_STEP_TEXT = "verify the connection";

export const CONNECT_AZURE_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/azure";

export const CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF = "/help/azure-permissions";

export const CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF = "/administration/connection-status";

export const CONNECT_AZURE_SECURELY_CONNECTION_STATUS_LINK_LABEL = "Connection status";

export const CONNECT_AZURE_SECURELY_VERIFY_SECTION_ID = "validate-connection";

export function buildConnectAzureSecurelyVerifyHref(returnHref?: string): string {
  const trimmed = returnHref?.trim() ?? "";
  const basePath = (trimmed.split("#")[0] ?? "").split("?")[0] ?? "";

  if (
    basePath === CONNECT_AZURE_SECURELY_CONFIGURE_HREF ||
    basePath.startsWith(`${CONNECT_AZURE_SECURELY_CONFIGURE_HREF}/`)
  ) {
    return `${basePath}#${CONNECT_AZURE_SECURELY_VERIFY_SECTION_ID}`;
  }

  return `${CONNECT_AZURE_SECURELY_CONFIGURE_HREF}#${CONNECT_AZURE_SECURELY_VERIFY_SECTION_ID}`;
}
