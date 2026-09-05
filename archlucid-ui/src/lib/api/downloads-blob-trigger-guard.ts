/** Wave-21 suggestion 207: reject problem JSON responses masquerading as binary exports. */
export function assertBinaryDownloadContentType(response: Response, expectedPrefixes: string[]): void {
  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
    throw new Error("Download blocked: server returned a problem response instead of a binary export.");
  }

  if (
    expectedPrefixes.length > 0
    && !expectedPrefixes.some((prefix) => contentType.startsWith(prefix.toLowerCase()))
  ) {
    throw new Error(`Download blocked: unexpected content type '${contentType || "unknown"}'.`);
  }
}
