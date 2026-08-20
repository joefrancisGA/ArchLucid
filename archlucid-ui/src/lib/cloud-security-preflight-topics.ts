import type { CloudProviderId } from "@/lib/cloud-platform-scope-storage";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type CloudSecurityPreflightTrustCenterControl = {
  readonly label: string;
  readonly href: string;
};

export type CloudSecurityPreflightTopic = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly trustCenterControl: CloudSecurityPreflightTrustCenterControl;
  /** When true, a successful validation run can mark this topic verified in the UI. */
  readonly verifiableAfterConnection?: boolean;
};

export type CloudSecurityPreflightVerificationState = Readonly<
  Record<string, { readonly verifiedUtc: string }>
>;

const TRUST_CONTROLS = {
  readOnlyScope: {
    label: "Trust center — read-only collection",
    href: inAppHelpHref("security-trust"),
  },
  leastPrivilege: {
    label: "Trust center — least privilege",
    href: inAppHelpHref("azure-permissions"),
  },
  noSecrets: {
    label: "Trust center — credential storage",
    href: inAppHelpHref("security-trust"),
  },
  federation: {
    label: "Trust center — workload identity federation",
    href: inAppHelpHref("cloud-connections-azure"),
  },
  dataCollected: {
    label: "Trust center — data collected",
    href: inAppHelpHref("data-handling"),
  },
  auditLogging: {
    label: "Trust center — audit expectations",
    href: inAppHelpHref("audit-trail"),
  },
} as const satisfies Record<string, CloudSecurityPreflightTrustCenterControl>;

const PROVIDER_SECURE_CONNECT_HELP_SLUG: Readonly<Record<CloudProviderId, string>> = {
  azure: "cloud-connections-azure",
  aws: "cloud-connections-aws",
  gcp: "cloud-connections-gcp",
};

const PROVIDER_LABEL: Readonly<Record<CloudProviderId, string>> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

const FEDERATION_TOPIC_IDS = new Set<string>(["identity-federation", "aws-role-trust", "gcp-wif-binding"]);

const LEAST_PRIVILEGE_TOPIC_IDS = new Set<string>(["least-privilege", "azure-subscription-scope"]);

const LEAST_PRIVILEGE_DETAIL: Readonly<Record<CloudProviderId, string>> = {
  azure:
    "Roles and permissions are scoped to the minimum required for inventory. Cost Management Reader is optional when cost evidence is enabled.",
  aws: "IAM roles and policies are scoped to read-only APIs required for Resource Explorer inventory.",
  gcp: "Service account roles are scoped to Cloud Asset Viewer and other read-only inventory APIs.",
};

const SHARED_TOPICS: readonly CloudSecurityPreflightTopic[] = [
  {
    id: "read-only-scope",
    label: "Read-only scope",
    detail: "Collection is limited to read-only APIs and inventory surfaces required for architecture evidence.",
    trustCenterControl: TRUST_CONTROLS.readOnlyScope,
    verifiableAfterConnection: true,
  },
  {
    id: "least-privilege",
    label: "Least privilege",
    detail: LEAST_PRIVILEGE_DETAIL.azure,
    trustCenterControl: TRUST_CONTROLS.leastPrivilege,
    verifiableAfterConnection: true,
  },
  {
    id: "no-long-lived-secrets",
    label: "No long-lived secrets",
    detail: "ArchLucid stores connection metadata only — not client secrets, access keys, or service-account JSON keys.",
    trustCenterControl: TRUST_CONTROLS.noSecrets,
  },
  {
    id: "identity-federation",
    label: "Identity federation",
    detail: "Access uses short-lived federated credentials rather than static credentials stored in ArchLucid.",
    trustCenterControl: TRUST_CONTROLS.federation,
    verifiableAfterConnection: true,
  },
  {
    id: "data-collected",
    label: "Data collected",
    detail: "Collected data is architecture inventory and supporting metadata used for review evidence — not application payloads.",
    trustCenterControl: TRUST_CONTROLS.dataCollected,
  },
  {
    id: "audit-logging",
    label: "Audit and logging expectations",
    detail: "Your cloud audit logs should record federated sign-in and read API calls from the ArchLucid connector identity.",
    trustCenterControl: TRUST_CONTROLS.auditLogging,
    verifiableAfterConnection: true,
  },
];

function providerTrustControls(provider: CloudProviderId): {
  readonly leastPrivilege: CloudSecurityPreflightTrustCenterControl;
  readonly federation: CloudSecurityPreflightTrustCenterControl;
} {
  const secureConnectHref = inAppHelpHref(PROVIDER_SECURE_CONNECT_HELP_SLUG[provider]);
  const providerLabel = PROVIDER_LABEL[provider];

  return {
    leastPrivilege:
      provider === "azure"
        ? TRUST_CONTROLS.leastPrivilege
        : {
            label: "Trust center — least privilege",
            href: secureConnectHref,
          },
    federation: {
      label: `Trust center — connect ${providerLabel} securely`,
      href: secureConnectHref,
    },
  };
}

function withProviderTrustControls(
  topics: readonly CloudSecurityPreflightTopic[],
  provider: CloudProviderId,
): readonly CloudSecurityPreflightTopic[] {
  const controls = providerTrustControls(provider);

  return topics.map((topic) => {
    if (FEDERATION_TOPIC_IDS.has(topic.id)) {
      return { ...topic, trustCenterControl: controls.federation };
    }

    if (LEAST_PRIVILEGE_TOPIC_IDS.has(topic.id)) {
      return {
        ...topic,
        detail: topic.id === "least-privilege" ? LEAST_PRIVILEGE_DETAIL[provider] : topic.detail,
        trustCenterControl: controls.leastPrivilege,
      };
    }

    return topic;
  });
}

const PROVIDER_TOPICS_BASE: Readonly<Record<CloudProviderId, readonly CloudSecurityPreflightTopic[]>> = {
  azure: [
    ...SHARED_TOPICS,
    {
      id: "azure-subscription-scope",
      label: "Subscription or management group scope",
      detail: "The service principal is scoped to selected subscriptions or management groups — not tenant-wide directory access.",
      trustCenterControl: TRUST_CONTROLS.leastPrivilege,
      verifiableAfterConnection: true,
    },
  ],
  aws: [
    ...SHARED_TOPICS,
    {
      id: "aws-role-trust",
      label: "IAM role trust policy",
      detail: "The read-only IAM role trusts ArchLucid through OIDC federation with an auditable trust policy.",
      trustCenterControl: TRUST_CONTROLS.federation,
      verifiableAfterConnection: true,
    },
  ],
  gcp: [
    ...SHARED_TOPICS,
    {
      id: "gcp-wif-binding",
      label: "Workload Identity Federation binding",
      detail: "The read-only service account is impersonated through Workload Identity Federation — not downloadable keys.",
      trustCenterControl: TRUST_CONTROLS.federation,
      verifiableAfterConnection: true,
    },
  ],
};

export function cloudSecurityPreflightTopics(provider: CloudProviderId): readonly CloudSecurityPreflightTopic[] {
  return withProviderTrustControls(PROVIDER_TOPICS_BASE[provider], provider);
}
