import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import type { CloudProviderId } from "@/lib/cloud-platform-scope-storage";

export function cloudProviderDetailPath(provider: CloudProviderId): string {
  return `${CLOUD_CONNECTIONS_PATH}/${provider}`;
}

export const CLOUD_CONNECTIONS_AZURE_PATH = cloudProviderDetailPath("azure");
export const CLOUD_CONNECTIONS_AWS_PATH = cloudProviderDetailPath("aws");
export const CLOUD_CONNECTIONS_GCP_PATH = cloudProviderDetailPath("gcp");
