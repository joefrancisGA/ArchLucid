import { describe, expect, it } from "vitest";

import {
  executiveWorkspaceHealthKpiTitle,
  executiveWorkspaceHealthPageLead,
  executiveWorkspaceHealthPageTitle,
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
} from "@/lib/sponsor/sponsor-workspace-health-page-copy";
import { TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK } from "@/lib/vocabulary/tenant-system-workspace-health-vocabulary";

describe("sponsor-workspace-health-page-copy", () => {
  it("names the destination 'Workspace health' in every shell", () => {
    expect(SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE).toBe("Workspace health");
    expect(SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE).toBe(TENANT_SYSTEM_WORKSPACE_HEALTH_WORKSPACE_LINK.label);
    expect(executiveWorkspaceHealthPageTitle(true)).toBe(SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE);
    expect(executiveWorkspaceHealthPageTitle(false)).toBe(SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE);
  });

  it("uses buyer-facing titles without numbered KPI prefixes", () => {
    expect(executiveWorkspaceHealthPageLead(true)).toContain("Approval status at a glance");
    expect(executiveWorkspaceHealthKpiTitle("preCommitOutcomes", true)).toBe("Approval gate outcomes (30 days)");
    expect(executiveWorkspaceHealthKpiTitle("highCriticalExposure", true)).toBe("High / Critical exposure (90 days)");
    expect(executiveWorkspaceHealthKpiTitle("complianceDrift", true)).not.toMatch(/^\d+\./);
  });

  it("keeps numbered KPI prefixes for the full operator shell", () => {
    expect(executiveWorkspaceHealthKpiTitle("preCommitOutcomes", false)).toBe("1. Pre-commit outcomes (30 days)");
    expect(executiveWorkspaceHealthKpiTitle("valueProxy", false)).toBe("5. Pre-commit blocks as value proxy");
  });
});
