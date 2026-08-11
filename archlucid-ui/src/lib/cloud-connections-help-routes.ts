/**
 * Canonical cloud-connection help URLs (Batch K).
 * Slash paths are public canonicals; hyphen slugs remain registry/PDF ids with permanent redirects.
 */

export const CLOUD_CONNECTIONS_HELP_PROVIDERS = ["azure", "aws", "gcp"] as const;

export type CloudConnectionsHelpProvider = (typeof CLOUD_CONNECTIONS_HELP_PROVIDERS)[number];

export const CLOUD_CONNECTIONS_HELP_REGISTRY_SLUG_BY_PROVIDER: Readonly<
  Record<CloudConnectionsHelpProvider, string>
> = {
  azure: "cloud-connections-azure",
  aws: "cloud-connections-aws",
  gcp: "cloud-connections-gcp",
};

/** App-router `[...topic]` segments for slash canonical help URLs. */
export const CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_SEGMENTS = CLOUD_CONNECTIONS_HELP_PROVIDERS.map(
  (provider) => `cloud-connections/${provider}`,
) as readonly string[];

/** Hyphen bookmark slugs → slash `/help/...` targets (parity with `help-topic-permanent-redirects`). */
export const CLOUD_CONNECTIONS_HELP_HYPHEN_BOOKMARK_REDIRECTS: Readonly<Record<string, string>> = {
  "cloud-connections-azure": "/help/cloud-connections/azure",
  "cloud-connections-aws": "/help/cloud-connections/aws",
  "cloud-connections-gcp": "/help/cloud-connections/gcp",
};

const CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_PATTERN = /^cloud-connections\/(azure|aws|gcp)$/;

export function normalizeCloudConnectionsSlashHelpTopicSlug(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();
  const match = CLOUD_CONNECTIONS_HELP_SLASH_TOPIC_PATTERN.exec(trimmed);

  if (match === null) {
    return null;
  }

  const provider = match[1] as CloudConnectionsHelpProvider;

  return CLOUD_CONNECTIONS_HELP_REGISTRY_SLUG_BY_PROVIDER[provider];
}

export function cloudConnectionsHelpPathSegmentForRegistrySlug(registrySlug: string): string | null {
  const normalized = registrySlug.trim().toLowerCase();

  for (const provider of CLOUD_CONNECTIONS_HELP_PROVIDERS) {
    if (CLOUD_CONNECTIONS_HELP_REGISTRY_SLUG_BY_PROVIDER[provider] === normalized) {
      return `cloud-connections/${provider}`;
    }
  }

  return null;
}
