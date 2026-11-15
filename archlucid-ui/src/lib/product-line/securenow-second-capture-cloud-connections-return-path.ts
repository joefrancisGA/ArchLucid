import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

import { SECURENOW_SECOND_CAPTURE_CTA_HREFS } from "./securenow-second-capture-cta-copy";

export const SECURENOW_RETURN_PATH_QUERY_PARAM = "securenowReturnPath" as const;

export function buildSecureNowSecondCaptureCloudConnectionsHref(returnPath: string | null | undefined): string {
  const trimmed = returnPath?.trim() ?? "";

  if (trimmed.length === 0 || !trimmed.startsWith("/")) {
    return SECURENOW_SECOND_CAPTURE_CTA_HREFS.cloudConnections;
  }

  const params = new URLSearchParams();
  params.set(SECURENOW_RETURN_PATH_QUERY_PARAM, trimmed);

  return `${CLOUD_CONNECTIONS_PATH}?${params.toString()}`;
}

export function resolveSecureNowReturnPathFromSearch(searchParams: URLSearchParams): string | null {
  const value = searchParams.get(SECURENOW_RETURN_PATH_QUERY_PARAM)?.trim() ?? "";

  if (value.length === 0 || !value.startsWith("/")) {
    return null;
  }

  return value;
}