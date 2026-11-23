import { EXTRACT_UPLOAD_PATH } from "@/lib/administration/extract-upload-demo-scenario-url";

import { canonicalSafeReturnPath } from "@/lib/navigation/safe-return-path";

import { SECURENOW_SECOND_CAPTURE_CTA_HREFS } from "./securenow-second-capture-cta-copy";

export const SECURENOW_RETURN_PATH_QUERY_PARAM = "securenowReturnPath" as const;

function acceptedReturnPath(returnPath: string | null | undefined): string | null {
  const trimmed = returnPath?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  // Same-origin check used by sign-in redirects. startsWith("/") still accepts //host and /\host.
  return canonicalSafeReturnPath(trimmed);
}

function buildSecureNowSecondCaptureHrefWithReturnPath(
  basePath: string,
  returnPath: string | null | undefined,
): string {
  const accepted = acceptedReturnPath(returnPath);

  if (accepted === null) {
    return basePath;
  }

  const params = new URLSearchParams();
  params.set(SECURENOW_RETURN_PATH_QUERY_PARAM, accepted);

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
  return acceptedReturnPath(searchParams.get(SECURENOW_RETURN_PATH_QUERY_PARAM));
}