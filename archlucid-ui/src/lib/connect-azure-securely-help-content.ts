/**
 * Customer-facing copy for `/help/cloud-connections/azure`.
 * Role requirements reuse `azure-cloud-connection-permissions-manifest.ts`.
 */
export const CONNECT_AZURE_SECURELY_PAGE_TITLE = "Connect Azure securely";

export const CONNECT_AZURE_SECURELY_PAGE_INTRO =
  "ArchLucid can use Azure metadata and cost evidence when you connect selected subscriptions. The Azure connection is optional; reviews can also use briefs, diagrams, documents, and uploaded evidence.";

export const CONNECT_AZURE_SECURELY_CONNECTION_VALUE =
  "Connecting Azure adds current resource and cost evidence to reviews. ArchLucid can still review uploaded documents and diagrams without a cloud connection.";

export const CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE =
  "This topic is setup orientation for Azure federated trust and read-only role assignment — it is not an evidence trail or signed review record. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

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

export const CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE =
  "Without Cost Management Reader, ArchLucid can still collect supported architecture metadata, but cost evidence and cost-related analysis will be unavailable.";

export const CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING = "Do not assign broad write-enabled roles";

export const CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL = "Restricted roles";

export const CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY =
  "ArchLucid does not require Owner, Contributor, User Access Administrator, or tenant-wide directory roles for an Azure cloud connection.";

export const CONNECT_AZURE_SECURELY_RETAINED_HEADING = "Information retained by ArchLucid";

export const CONNECT_AZURE_SECURELY_RETAINED_ITEMS = [
  "Azure tenant ID",
  "Application or client ID",
  "Selected subscription or management-group scope",
  "Connection status",
  "Last validation time",
] as const;

export const CONNECT_AZURE_SECURELY_CREDENTIALS_HEADING = "Credentials ArchLucid does not retain";

export const CONNECT_AZURE_SECURELY_CREDENTIALS_ITEMS = [
  "Client secrets",
  "Azure access tokens beyond their required runtime lifecycle",
  "Private keys",
] as const;

export const CONNECT_AZURE_SECURELY_PERMISSIONS_HEADING = "Permissions ArchLucid does not require";

export const CONNECT_AZURE_SECURELY_PERMISSIONS_ITEMS = [
  "Owner",
  "Contributor",
  "User Access Administrator",
  "Tenant-wide Global Reader or other broad directory roles",
] as const;

export const CONNECT_AZURE_SECURELY_DATA_NOT_COLLECTED_HEADING = "Customer data not collected";

export const CONNECT_AZURE_SECURELY_VERIFICATION_HEADING = "What verification confirms";

export const CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS_LABEL = "Confirmed by hosted verification";

export const CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL = "Not confirmed by hosted verification";

export const CONNECT_AZURE_SECURELY_VERIFY_STEP_TEXT = "Return to ArchLucid and verify the connection";

export const CONNECT_AZURE_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/azure";

export const CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF = "/help/azure-permissions";

export const CONNECT_AZURE_SECURELY_VERIFY_HREF =
  "/help/azure-permissions#azure-permissions-verify-heading";
