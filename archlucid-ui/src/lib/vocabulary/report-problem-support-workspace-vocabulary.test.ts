import { describe, expect, it } from "vitest";

import {
  REPORT_PROBLEM_SUPPORT_WORKSPACE_COMPACT_LINE,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_HEADING,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_WHY_TWO,
  buildReportProblemSupportWorkspaceVocabulary,
  resolveReportProblemSupportWorkspacePeerLink,
} from "@/lib/vocabulary/report-problem-support-workspace-vocabulary";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";

describe("report-problem-support-workspace-vocabulary (TB-2306)", () => {
  it("explains support intake help vs administration support workspace", () => {
    const model = buildReportProblemSupportWorkspaceVocabulary();

    expect(model.heading).toBe(REPORT_PROBLEM_SUPPORT_WORKSPACE_HEADING);
    expect(model.whyTwo).toBe(REPORT_PROBLEM_SUPPORT_WORKSPACE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("intake");
    expect(model.whyTwo.toLowerCase()).toContain("bundle");
    expect(model.compactLine).toBe(REPORT_PROBLEM_SUPPORT_WORKSPACE_COMPACT_LINE);

    expect(model.reportAProblemLink).toEqual(
      REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK,
    );
    expect(model.reportAProblemLink.href).toBe(SUPPORT_REPORT_PROBLEM_HELP_HREF);
    expect(model.supportWorkspaceLink).toEqual(
      REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK,
    );
    expect(model.supportWorkspaceLink.href).toBe(SETTINGS_SUPPORT_PATH);
  });

  it("resolves the peer surface from report-a-problem and support-workspace", () => {
    expect(resolveReportProblemSupportWorkspacePeerLink("report-a-problem")).toEqual(
      REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK,
    );

    expect(resolveReportProblemSupportWorkspacePeerLink("support-workspace")).toEqual(
      REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK,
    );
  });
});
