/**
 * Customer-facing GCP cloud-connection permission contract.
 * Keep in sync with hosted GCP extractor and Workload Identity Federation onboarding.
 */
export const GCP_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION = "2026-08-10";

export type GcpPermissionRequirementLabel = "required" | "optional" | "conditional";

export function formatGcpPermissionRequirementLabel(label: GcpPermissionRequirementLabel): string {
  switch (label) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    case "conditional":
      return "Conditional";
    default: {
      const exhaustive: never = label;

      return exhaustive;
    }
  }
}

export type GcpCloudConnectionPermissionRow = {
  readonly gcpRole: string;
  readonly displayName: string;
  readonly requirement: GcpPermissionRequirementLabel;
  readonly purpose: string;
  readonly recommendedScope: string;
  readonly writeAccess: false;
};

export const GCP_CLOUD_CONNECTION_FORBIDDEN_ROLES: readonly string[] = [
  "Owner",
  "Editor",
  "roles/iam.serviceAccountKeyAdmin",
];

export const GCP_CLOUD_CONNECTION_API_PREREQUISITES: readonly string[] = [
  "Enable cloudasset.googleapis.com (Cloud Asset Inventory API) on the GCP project before assigning roles.",
  "Create a Workload Identity Pool provider that trusts ArchLucid's federated identity (see setup steps above).",
];

export const GCP_CLOUD_CONNECTION_PERMISSION_ROWS: readonly GcpCloudConnectionPermissionRow[] = [
  {
    gcpRole: "roles/cloudasset.viewer",
    displayName: "Cloud Asset Viewer",
    requirement: "required",
    purpose: "Reads project and folder asset inventory for architecture evidence.",
    recommendedScope: "GCP project used for the connection",
    writeAccess: false,
  },
  {
    gcpRole: "roles/iam.workloadIdentityUser",
    displayName: "Workload Identity User",
    requirement: "required",
    purpose:
      "Allows ArchLucid's federated principal to impersonate the read-only service account at runtime through Workload Identity Federation.",
    recommendedScope:
      "Service account used for Cloud Asset reads (principal is the Workload Identity Pool subject)",
    writeAccess: false,
  },
];

export const GCP_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS: readonly string[] = [
  "Workload Identity Pool provider trust does not match ArchLucid's federated identity — confirm issuer, audience, and subject attribute mapping.",
  "Attribute mapping on the pool provider is incorrect — google.subject should map to assertion.sub.",
  "Service account impersonation binding is missing or scoped to the wrong principal — confirm roles/iam.workloadIdentityUser on the service account.",
  "Cloud Asset Inventory API is not enabled on the project — enable cloudasset.googleapis.com before running Re-poll now.",
  "Cloud Asset Viewer is not assigned to the service account — grant roles/cloudasset.viewer at project scope.",
  "Federation identifiers have not propagated — wait and retry verification after IAM changes.",
];
