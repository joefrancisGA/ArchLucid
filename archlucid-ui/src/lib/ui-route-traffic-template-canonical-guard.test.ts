import { describe, expect, it } from "vitest";

import {
  extractMasterTablePaths,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

const REDIRECT_ONLY_PATHS = [
  "/admin/ai-usage-cost",
  "/alert-routing",
  "/dashboard",
  "/portfolio",
  "/sponsor/dashboard",
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
  "/sponsor-report/sponsor-report",
  "/sponsor-report/roi-summary",
  "/sponsor-report/pilot-outcomes",
  "/replay",
  "/internal/replay",
  "/settings/cost-reporting",
  "/health",
  "/governance/dashboard",
  "/sponsor/scorecard",
];

describe("ui-route-traffic-template-canonical-guard (TB-748)", () => {
  it("tracks canonical nav paths, not redirect-only legacy aliases", () => {
    const paths = extractMasterTablePaths(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain("/governance/alerts");
    expect(paths).toContain("/integrations/cloud-connections");
    expect(paths).toContain("/governance/sealed-records");
    expect(paths).toContain("/governance/sealed-records/[manifestId]");
    expect(paths).toContain("/governance/sealed-records/[manifestId]/artifacts/[artifactId]");
    expect(paths).toContain("/internal/health");
    expect(paths).toContain("/insights/sponsor-report");
    expect(paths).toContain("/internal/validate-route");

    for (const legacyPath of REDIRECT_ONLY_PATHS) {
      expect(paths).not.toContain(legacyPath);
    }
  });
});
