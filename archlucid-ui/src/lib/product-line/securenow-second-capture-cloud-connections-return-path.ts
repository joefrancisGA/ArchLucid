import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

import { EXTRACT_UPLOAD_PATH } from "@/lib/administration/extract-upload-demo-scenario-url";

import { SECURENOW_SECOND_CAPTURE_CTA_HREFS } from "./securenow-second-capture-cta-copy";

export const SECURENOW_RETURN_PATH_QUERY_PARAM = "securenowReturnPath" as const;

function buildSecureNowSecondCaptureHrefWithReturnPath(
  basePath: string,
  returnPath: string | null | undefined,
): string {
  const trimmed = returnPath?.trim() ?? "";

  if (trimmed.length === 0 || !trimmed.startsWith("/")) {
    return basePath;
  }

  const params = new URLSearchParams();
  params.set(SECURENOW_RETURN_PATH_QUERY_PARAM, trimmed);

  return `${basePath}?${params.toString()}`;
}

export function buildSecureNowSecondCaptureCloudConnectionsHref(returnPath: string | null | undefined): string {
  return buildSecureNowSecondCaptureHrefWithReturnPath(
    SECURENOW_SECOND_CAPTURE_CTA_HREFS.cloudConnections,
    returnPath,
  );
}

export function buildSecureNowSecondCaptureExtractUploadHref(returnPath: string | null | undefined): string {
  return buildSecureNowSecondCaptureHrefWithReturnPath(EXTRACT_UPLOAD_PATH, returnPath);
}

export function resolveSecureNowReturnPathFromSearch(searchParams: URLSearchParams): string | null {
  const value = searchParams.get(SECURENOW_RETURN_PATH_QUERY_PARAM)?.trim() ?? "";

  if (value.length === 0 || !value.startsWith("/")) {
    return null;
  }

  return value;
}