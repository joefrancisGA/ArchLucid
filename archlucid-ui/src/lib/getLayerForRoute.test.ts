import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { getLayerForRoute } from "./getLayerForRoute";

describe("getLayerForRoute", () => {
  it("returns pilot for the home path", () => {
    expect(getLayerForRoute("/")).toBe("pilot");
    expect(getLayerForRoute(EXECUTIVE_DASHBOARD_HREF)).toBe("pilot");
  });

  it("returns operate-analysis for evidence graph routes", () => {
    expect(getLayerForRoute("/insights/evidence-graph")).toBe("operate-analysis");
  });

  it("returns operate-analysis for a known analysis nav path", () => {
    expect(getLayerForRoute("/insights/ask-review-questions")).toBe("operate-analysis");
    expect(getLayerForRoute("/insights/search-review-evidence")).toBe("operate-analysis");
  });

  it("returns operator-admin for tenant admin nav paths", () => {
    expect(getLayerForRoute("/administration/billing")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/baseline")).toBe("operator-admin");
    expect(getLayerForRoute("/integrations/cloud-connections")).toBe("operate-analysis");
    expect(getLayerForRoute("/settings/cloud-connections")).toBe("operate-analysis");
    expect(getLayerForRoute("/administration/tenant")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/tenant/recycle-bin")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/support")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/users")).toBe("operator-admin");
    expect(getLayerForRoute("/settings/roles")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/users/invite-reviewer")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/ai-usage")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/connection-status")).toBe("operator-admin");
    expect(getLayerForRoute("/administration/system-health")).toBe("operator-admin");
    expect(getLayerForRoute("/workspace/security-trust")).toBe("operator-admin");
  });

  it("returns operate-governance for a known governance nav path and nested routes", () => {
    expect(getLayerForRoute("/governance/alerts")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/approval-queue")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/approval-requests/1")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/findings")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/standards-and-rules")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/audit")).toBe("operate-governance");
    expect(getLayerForRoute("/governance/policy-packs")).toBe("operate-governance");
  });

  it("prefers the longer nav path when multiple prefixes could match (reviews/new over reviews)", () => {
    expect(getLayerForRoute("/architecture/reviews/new")).toBe("pilot");
    expect(getLayerForRoute("/architectures/new")).toBe("pilot");
    expect(getLayerForRoute("/architectures/draft-1")).toBe("pilot");
  });

  it("maps review detail under the Reviews list path", () => {
    expect(getLayerForRoute("/architecture/reviews/550e8400-e29b-41d4-a716-446655440000")).toBe("pilot");
  });

  it("returns operate-analysis for reports and system-admin nav paths", () => {
    expect(getLayerForRoute("/insights/architecture-scorecard")).toBe("operate-analysis");
    expect(getLayerForRoute("/integrations/teams")).toBe("operate-analysis");
    expect(getLayerForRoute("/internal/product-learning")).toBe("operator-admin");
    expect(getLayerForRoute("/governance/advisory-scans")).toBe("operate-governance");
  });

  it("returns pilot for paths not in NAV_GROUPS", () => {
    expect(getLayerForRoute("/this-route-not-in-config")).toBe("pilot");
  });

  it("treats empty pathname as /", () => {
    expect(getLayerForRoute("")).toBe("pilot");
  });
});
