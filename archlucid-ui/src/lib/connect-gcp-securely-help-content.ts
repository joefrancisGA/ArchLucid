/**
 * Customer-facing copy for `/help/cloud-connections/gcp`.
 * Permission rows reuse `gcp-cloud-connection-permissions-manifest.ts`.
 */
import { GCP_FEDERATION_IDENTIFIER_SOURCING } from "@/lib/gcp-cloud-connection-federation-identity-source";

export const CONNECT_GCP_SECURELY_PAGE_TITLE = "Connect GCP securely";

export const CONNECT_GCP_SECURELY_PAGE_LEAD =
  "ArchLucid can use GCP resource inventory when you connect a GCP project. The GCP connection is optional — reviews can also use briefs, diagrams, documents, and uploaded inventory.";

export const CONNECT_GCP_SECURELY_CONNECTION_VALUE =
  "Connecting GCP adds current Cloud Asset Inventory to reviews. ArchLucid can still review uploaded documents and diagrams without a cloud connection.";

export const CONNECT_GCP_SECURELY_UPLOAD_INVENTORY_NOTE =
  "You can also export a read-only inventory package from your GCP project with your own operator credentials and upload it from the New architecture review wizard. ArchLucid never receives your service-account JSON keys.";

export const CONNECT_GCP_SECURELY_SCHEDULED_COLLECTION_NOTE =
  "Connect a GCP project when you want ArchLucid to collect read-only inventory on a schedule through Workload Identity Federation — without storing JSON keys in your workspace.";

export const CONNECT_GCP_SECURELY_BACK_TO_CONNECTIONS = "Back to cloud connections";

export const CONNECT_GCP_SECURELY_CONFIGURE_ACTION = "Open GCP connection settings";

export const CONNECT_GCP_SECURELY_SECURITY_HEADING = "Security model";

export const CONNECT_GCP_SECURELY_SECURITY_ITEMS = [
  {
    id: "workload-identity-federation",
    title: "Workload Identity Federation",
    detail:
      "ArchLucid authenticates through a pool provider bound to ArchLucid's federated identity. Impersonation uses federated tokens at runtime — no downloadable service-account JSON keys.",
  },
  {
    id: "read-only",
    title: "Read-only inventory",
    detail: "ArchLucid requests only Cloud Asset Inventory read APIs needed to collect architecture evidence.",
  },
  {
    id: "project-scoped",
    title: "Project-scoped access",
    detail: "You provision the pool provider and service account in your GCP project and can revoke bindings at any time.",
  },
  {
    id: "customer-controlled",
    title: "Customer-controlled access",
    detail: "Your GCP administrator controls the Workload Identity Pool, service account, and IAM bindings.",
  },
] as const;

export const CONNECT_GCP_SECURELY_SETUP_HEADING = "Set up the GCP connection";

export const CONNECT_GCP_SECURELY_SETUP_STEPS = [
  {
    id: "open-cloud-connections",
    text: "Open Cloud connections and begin a GCP connection.",
  },
  {
    id: "complete-security-review",
    text: "Complete the in-product security review checklist on the GCP connection page.",
  },
  {
    id: "configure-wif",
    text: "Create a Workload Identity Pool provider that trusts ArchLucid's federated identity and bind a read-only service account (identifiers and starter script below).",
  },
  {
    id: "enter-connection-details",
    text: "Enter GCP project ID, Workload Identity Pool provider resource name, and service account email.",
  },
  {
    id: "verify",
    text: "Save the connection, then run Re-poll now to confirm federation and inventory access.",
  },
] as const;

export const CONNECT_GCP_SECURELY_FEDERATION_SOURCING = GCP_FEDERATION_IDENTIFIER_SOURCING;

export {
  GCP_WIF_STARTER_FEDERATION_HEADING as CONNECT_GCP_SECURELY_FEDERATION_HEADING,
  GCP_WIF_STARTER_FEDERATION_IDENTIFIERS as CONNECT_GCP_SECURELY_FEDERATION_IDENTIFIERS,
  GCP_WIF_STARTER_FEDERATION_INTRO as CONNECT_GCP_SECURELY_FEDERATION_INTRO,
  GCP_WIF_STARTER_IDENTITY_INTRO as CONNECT_GCP_SECURELY_WIF_IDENTITY_INTRO,
  GCP_WIF_STARTER_SCRIPT_HEADING as CONNECT_GCP_SECURELY_WIF_SCRIPT_HEADING,
  GCP_WIF_STARTER_SCRIPT_INTRO as CONNECT_GCP_SECURELY_WIF_SCRIPT_INTRO,
  GCP_WIF_STARTER_SCRIPT_REPLACE_HINT as CONNECT_GCP_SECURELY_WIF_SCRIPT_REPLACE_HINT,
  buildGcpWorkloadIdentityPoolProviderSetupScript as buildConnectGcpSecurelyWifSetupScript,
  type GcpWifStarterFederationIdentifier as ConnectGcpSecurelyFederationIdentifier,
} from "@/lib/gcp-cloud-connection-wif-starter";

export const CONNECT_GCP_SECURELY_ROLES_HEADING = "GCP roles";

export const CONNECT_GCP_SECURELY_ROLES_NOTE =
  "Enable the Cloud Asset Inventory API, then grant Cloud Asset Viewer and Workload Identity User on the service account ArchLucid impersonates. ArchLucid does not require project Owner or Editor.";

export const CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_HEADING = "Do not assign broad write-enabled roles";

export const CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL = "Restricted roles";

export const CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_BODY =
  "ArchLucid does not require Owner, Editor, roles/iam.serviceAccountKeyAdmin, or any role that can modify your GCP infrastructure on your behalf.";

export const CONNECT_GCP_SECURELY_VERIFICATION_HEADING = "What verification confirms";

export const CONNECT_GCP_SECURELY_VERIFICATION_CHECKS_LABEL = "Confirmed by connection verification";

export const CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL = "Not confirmed by connection verification";

export const CONNECT_GCP_SECURELY_VERIFICATION_CHECKS: readonly string[] = [
  "Workload Identity Federation token exchange",
  "Service account impersonation binding",
  "Cloud Asset Viewer access to list project assets",
  "Inventory import into the workspace",
];

export const CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY: readonly string[] = [
  "Folder- or organization-wide inventory outside the connected project",
  "Billing or cost export permissions",
];

export const CONNECT_GCP_SECURELY_RETAINED_ITEMS = [
  "GCP project ID",
  "Workload Identity Pool provider resource name",
  "Service account email",
  "Connection status",
  "Last polled timestamp",
] as const;

export const CONNECT_GCP_SECURELY_CREDENTIALS_ITEMS = [
  "Service-account JSON key files",
  "Owner or Editor privileges",
  "Private keys",
] as const;

export const CONNECT_GCP_SECURELY_PERMISSIONS_ITEMS = [
  "Owner",
  "Editor",
  "roles/iam.serviceAccountKeyAdmin",
  "Roles that grant infrastructure write or IAM administration",
] as const;

export const CONNECT_GCP_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/gcp";

export const CONNECT_GCP_SECURELY_CONNECTION_STATUS_HREF = "/administration/connection-status";

export const CONNECT_GCP_SECURELY_CONNECTION_STATUS_LINK_LABEL = "Connection status";
