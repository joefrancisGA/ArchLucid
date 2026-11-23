import { describe, expect, it } from "vitest";

import {
  buildSecureNowSecondCaptureCloudConnectionsHref,
  resolveSecureNowReturnPathFromSearch,
  SECURENOW_RETURN_PATH_QUERY_PARAM,
} from "./securenow-second-capture-cloud-connections-return-path";

describe("securenow second capture cloud connections return path", () => {
  it("builds href with return path query", () => {
    const href = buildSecureNowSecondCaptureCloudConnectionsHref("/governance/remediation-factory?tab=attack");

    expect(href).toContain(SECURENOW_RETURN_PATH_QUERY_PARAM);
    expect(href).toContain(encodeURIComponent("/governance/remediation-factory?tab=attack"));
  });

  it("rejects unsafe return paths", () => {
    expect(buildSecureNowSecondCaptureCloudConnectionsHref("https://evil.test")).not.toContain("evil");
  });

  it("rejects a protocol-relative return path the same way sign-in return paths do", () => {
    expect(buildSecureNowSecondCaptureCloudConnectionsHref("//evil.example")).not.toContain("evil");

    const params = new URLSearchParams();
    params.set(SECURENOW_RETURN_PATH_QUERY_PARAM, "//evil.example");

    expect(resolveSecureNowReturnPathFromSearch(params)).toBeNull();
  });

  it("reads return path from search", () => {
    const params = new URLSearchParams();
    params.set(SECURENOW_RETURN_PATH_QUERY_PARAM, "/security/home");

    expect(resolveSecureNowReturnPathFromSearch(params)).toBe("/security/home");
  });
});