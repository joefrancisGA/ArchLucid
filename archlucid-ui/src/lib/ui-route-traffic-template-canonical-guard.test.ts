import { describe, expect, it } from "vitest";

import {
  extractMasterTablePaths,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

const REDIRECT_ONLY_PATHS = [
  "/alerts",
  "/audit",
  "/settings/cloud-connections",
  "/settings/roles",
  "/admin/users",
  "/admin/support",
  "/admin/health",
  "/admin/tenant-health",
  "/admin/fleet-llm-cogs",
  "/workspace/security-trust",
  "/help/cloud-connections-azure",
  "/help/cloud-connections-aws",
  "/help/cloud-connections-gcp",
  "/admin/cloud-connections/aws",
  "/signed-records",
  "/signed-records/[manifestId]",
  "/sponsor-report/executive-summary",
  "/sponsor-report/roi-summary",
  "/sponsor-report/pilot-outcomes",
  "/replay",
  "/settings/cost-reporting",
  "/health",
  "/governance/dashboard",
  "/executive/scorecard",
];

describe("ui-route-traffic-template-canonical-guard (TB-748)", () => {
  it("tracks canonical nav paths, not redirect-only legacy aliases", () => {
    const paths = extractMasterTablePaths(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain("/governance/alerts");
    expect(paths).toContain("/integrations/cloud-connections");
    expect(paths).toContain("/governance/signed-records");
    expect(paths).toContain("/governance/signed-records/[manifestId]");
    expect(paths).toContain("/governance/signed-records/[manifestId]/artifacts/[artifactId]");
    expect(paths).toContain("/internal/health");
    expect(paths).toContain("/insights/executive-summary");
    expect(paths).toContain("/internal/replay");

    for (const legacyPath of REDIRECT_ONLY_PATHS) {
      expect(paths).not.toContain(legacyPath);
    }
  });
});
