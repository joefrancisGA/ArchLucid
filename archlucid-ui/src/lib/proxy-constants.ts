/**
 * Default cap for JSON and other non-multipart proxy POSTs/PUTs/PATCHes.
 * Protects the Node event loop from oversized bodies that would block buffering.
 */
export const PROXY_MAX_BODY_BYTES = 1_048_576; // 1 MB

/**
 * Cap for multipart evidence / package uploads forwarded through `/api/proxy`.
 * Aligns with API bulk-evidence envelope (`EvidenceBulkUploadMaxTotalBytes` = 100 MB).
 */
export const PROXY_MAX_MULTIPART_BODY_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * True when the request is a multipart upload (or a known large binary upload path).
 * JSON shell calls stay on {@link PROXY_MAX_BODY_BYTES}.
 */
export function isProxyLargeUploadRequest(pathForLog: string, contentType: string | null): boolean {
  const normalizedType = (contentType ?? "").toLowerCase();

  if (normalizedType.includes("multipart/form-data")) {
    return true;
  }

  const path = pathForLog.toLowerCase();

  if (path.includes("/evidence/extract-text")) {
    return true;
  }

  if (path.includes("/evidence/bulk")) {
    return true;
  }

  if (path.includes("/azure-extractor/upload")) {
    return true;
  }

  // AWS/GCP inventory ZIPs: POST v1/extractor/aws|gcp/upload
  if (path.includes("/extractor/") && path.includes("/upload")) {
    return true;
  }

  if (path.includes("/upload-sessions/") && path.includes("/chunks/")) {
    return true;
  }

  return false;
}

/** True when the proxy is forwarding the development SQL catalog reset. */
export function isProxyDevelopmentCatalogResetRequest(pathForLog: string): boolean {
  const path = pathForLog.toLowerCase().replaceAll("\\", "/");

  return path.includes("diagnostics/reset-development-catalog");
}

/** Resolves the proxy body byte cap for a mutating forward. */
export function resolveProxyMaxBodyBytes(pathForLog: string, contentType: string | null): number {
  if (isProxyLargeUploadRequest(pathForLog, contentType)) {
    return PROXY_MAX_MULTIPART_BODY_BYTES;
  }

  return PROXY_MAX_BODY_BYTES;
}
