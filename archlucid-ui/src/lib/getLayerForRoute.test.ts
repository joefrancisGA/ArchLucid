import { describe, expect, it } from "vitest";

import { getLayerForRoute } from "./getLayerForRoute";

describe("getLayerForRoute", () => {
  it("returns pilot for the home path", () => {
    expect(getLayerForRoute("/")).toBe("pilot");
    expect(getLayerForRoute("/dashboard")).toBe("pilot");
  });

  it("returns operate-analysis for evidence graph routes", () => {
    expect(getLayerForRoute("/graph")).toBe("operate-analysis");
  });

  it("returns operate-analysis for a known analysis nav path", () => {
    expect(getLayerForRoute("/ask")).toBe("operate-analysis");
    expect(getLayerForRoute("/search")).toBe("operate-analysis");
  });

  it("returns operator-admin for tenant admin nav paths", () => {
    expect(getLayerForRoute("/settings/billing")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/baseline")).toBe("pilot");
    expect(getLayerForRoute("/integrations/cloud-connections")).toBe("operate-analysis");
    expect(getLayerForRoute("/settings/cloud-connections")).toBe("operate-analysis");
    expect(getLayerForRoute("/settings/tenant")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/tenant/recycle-bin")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/support")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/users")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/roles")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/users/invite-reviewer")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/ai-usage")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/cost-reporting")).toBe("operator-admin");
    expect(getLayerForRoute("/integrations/readiness")).toBe("operator-admin");
    expect(getLayerForRoute("/workspace/security-trust")).toBe("operator-admin");
  });

  it("returns operate-governance for a known governance nav path and nested routes", () => {
    expect(getLayerForRoute("/governance/alerts")).toBe("operate-governance");
    expect(getLayerForRoute("/governance")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/approval-requests/1")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/dashboard/weekly")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/findings")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/resolution")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/audit")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/policy-packs")).toBe("operate-governance");
  });

  it("prefers the longer nav path when multiple prefixes could match (reviews/new over reviews)", () => {
    expect(getLayerForRoute("/reviews/new")).toBe("pilot");
  });

  it("maps review detail under the Reviews list path", () => {
    expect(getLayerForRoute("/reviews/550e8400-e29b-41d4-a716-446655440000")).toBe("pilot");
  });

  it("returns operate-analysis for reports and system-admin nav paths", () => {
    expect(getLayerForRoute("/scorecard")).toBe("operate-analysis");
    expect(getLayerForRoute("/integrations/teams")).toBe("operate-analysis");
    expect(getLayerForRoute("/product-learning")).toBe("operate-analysis");
    expect(getLayerForRoute("/advisory")).toBe("operate-governance");
  });

  it("returns pilot for paths not in NAV_GROUPS", () => {
    expect(getLayerForRoute("/this-route-not-in-config")).toBe("pilot");
  });

  it("treats empty pathname as /", () => {
    expect(getLayerForRoute("")).toBe("pilot");
  });
});
