import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import type { CloudProviderId } from "@/lib/cloud-platform-scope-storage";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const CLOUD_CONNECTIONS_PLATFORM_PARAM = "platform";

const CLOUD_PLATFORM_IDS = new Set<string>(["azure", "aws", "gcp"]);

export type CloudConnectionsPlatformFilter = CloudProviderId | "all";

export function parseCloudConnectionsPlatformFromSearch(
  raw: string | null | undefined,
): CloudConnectionsPlatformFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim().toLowerCase();

  if (!CLOUD_PLATFORM_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed as CloudProviderId;
}

export function cloudConnectionsPlatformHrefFromSearch(
  currentSearch: string,
  platform: CloudConnectionsPlatformFilter,
  pathname: string = CLOUD_CONNECTIONS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (platform === "all") {
      params.delete(CLOUD_CONNECTIONS_PLATFORM_PARAM);
    } else {
      params.set(CLOUD_CONNECTIONS_PLATFORM_PARAM, platform);
    }
    },
  });
}
