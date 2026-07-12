import type { CloudProviderId } from "@/lib/cloud-platform-scope-storage";

export type CloudSecurityPreflightTopic = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
};

const SHARED_TOPICS: readonly CloudSecurityPreflightTopic[] = [
  {
    id: "read-only-scope",
    label: "Read-only scope",
    detail: "Collection is limited to read-only APIs and inventory surfaces required for architecture evidence.",
  },
  {
    id: "least-privilege",
    label: "Least privilege",
    detail: "Roles and permissions are scoped to the minimum required for inventory and cost visibility.",
  },
  {
    id: "no-long-lived-secrets",
    label: "No long-lived secrets",
    detail: "ArchLucid stores connection metadata only — not client secrets, access keys, or service-account JSON keys.",
  },
  {
    id: "identity-federation",
    label: "Identity federation",
    detail: "Access uses short-lived federated credentials rather than static credentials stored in ArchLucid.",
  },
  {
    id: "data-collected",
    label: "Data collected",
    detail: "Collected data is architecture inventory and supporting metadata used for review evidence — not application payloads.",
  },
  {
    id: "audit-logging",
    label: "Audit and logging expectations",
    detail: "Your cloud audit logs should record federated sign-in and read API calls from the ArchLucid connector identity.",
  },
];

const PROVIDER_TOPICS: Readonly<Record<CloudProviderId, readonly CloudSecurityPreflightTopic[]>> = {
  azure: [
    ...SHARED_TOPICS,
    {
      id: "azure-subscription-scope",
      label: "Subscription or management group scope",
      detail: "The service principal is scoped to selected subscriptions or management groups — not tenant-wide directory access.",
    },
  ],
  aws: [
    ...SHARED_TOPICS,
    {
      id: "aws-role-trust",
      label: "IAM role trust policy",
      detail: "The read-only IAM role trusts ArchLucid through OIDC federation with an auditable trust policy.",
    },
  ],
  gcp: [
    ...SHARED_TOPICS,
    {
      id: "gcp-wif-binding",
      label: "Workload Identity Federation binding",
      detail: "The read-only service account is impersonated through Workload Identity Federation — not downloadable keys.",
    },
  ],
};

export function cloudSecurityPreflightTopics(provider: CloudProviderId): readonly CloudSecurityPreflightTopic[] {
  return PROVIDER_TOPICS[provider];
}
