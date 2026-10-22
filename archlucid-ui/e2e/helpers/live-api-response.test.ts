import { describe, expect, it } from "vitest";

import { formatLiveApiAuthFailureHint } from "./live-api-response";

describe("formatLiveApiAuthFailureHint", () => {
  it("returns empty when the status is not 401", () => {
    expect(formatLiveApiAuthFailureHint(403, "GET /v1/admin/users/invitations")).toBe("");
  });

  it("explains JwtBearer vs ApiKey vs DevelopmentBypass for API 401s", () => {
    const hint = formatLiveApiAuthFailureHint(401, "GET /v1/architecture/runs");

    expect(hint).toContain("JwtBearer CI needs LIVE_JWT_TOKEN");
    expect(hint).toContain("LIVE_API_URL");
  });

  it("adds invite-wave JWT refresh diagnostics for invitation 401s", () => {
    const hint = formatLiveApiAuthFailureHint(401, "GET /v1/admin/users/invitations");

    expect(hint).toContain("refresh_private_beta_ci_jwt.sh");
    expect(hint).toContain("HTTP 000");
  });
});
