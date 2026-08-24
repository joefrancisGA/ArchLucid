import { describe, expect, it } from "vitest";

import {
  PROXY_MAX_BODY_BYTES,
  PROXY_MAX_MULTIPART_BODY_BYTES,
  isProxyDevelopmentCatalogResetRequest,
  isProxyLargeUploadRequest,
  resolveProxyMaxBodyBytes,
} from "./proxy-constants";

describe("resolveProxyMaxBodyBytes", () => {
  it("keeps the 1 MB cap for JSON posts", () => {
    expect(resolveProxyMaxBodyBytes("v1/architecture/run", "application/json")).toBe(PROXY_MAX_BODY_BYTES);
    expect(isProxyLargeUploadRequest("v1/architecture/run", "application/json")).toBe(false);
  });

  it("allows 100 MB for multipart form uploads", () => {
    expect(
      resolveProxyMaxBodyBytes(
        "v1/architecture/review/abc/evidence/bulk",
        "multipart/form-data; boundary=----x",
      ),
    ).toBe(PROXY_MAX_MULTIPART_BODY_BYTES);
  });

  it("allows 100 MB for known evidence and extractor upload paths without multipart header", () => {
    expect(resolveProxyMaxBodyBytes("v1/architecture/review/abc/evidence/bulk", null)).toBe(
      PROXY_MAX_MULTIPART_BODY_BYTES,
    );
    expect(resolveProxyMaxBodyBytes("v1/azure-extractor/upload", null)).toBe(PROXY_MAX_MULTIPART_BODY_BYTES);
    expect(resolveProxyMaxBodyBytes("v1/extractor/aws/upload", null)).toBe(PROXY_MAX_MULTIPART_BODY_BYTES);
    expect(resolveProxyMaxBodyBytes("v1/extractor/gcp/upload", null)).toBe(PROXY_MAX_MULTIPART_BODY_BYTES);
    expect(resolveProxyMaxBodyBytes("v1/architecture/evidence/extract-text", null)).toBe(
      PROXY_MAX_MULTIPART_BODY_BYTES,
    );
    expect(
      resolveProxyMaxBodyBytes("v1/azure-extractor/upload-sessions/s1/chunks/0", "application/octet-stream"),
    ).toBe(PROXY_MAX_MULTIPART_BODY_BYTES);
  });
});

describe("isProxyDevelopmentCatalogResetRequest", () => {
  it("matches the diagnostics catalog reset path", () => {
    expect(isProxyDevelopmentCatalogResetRequest("v1/diagnostics/reset-development-catalog")).toBe(true);
    expect(isProxyDevelopmentCatalogResetRequest("V1/Diagnostics/Reset-Development-Catalog")).toBe(true);
  });

  it("does not match other diagnostics routes", () => {
    expect(isProxyDevelopmentCatalogResetRequest("v1/diagnostics/health")).toBe(false);
    expect(isProxyDevelopmentCatalogResetRequest("v1/architecture/request")).toBe(false);
  });
});
