import { describe, expect, it } from "vitest";

import {
  findReportProblemSupportOverclaimPhrases,
  includesReportProblemSlaCopy,
  REPORT_PROBLEM_HELP_SLA_SENTENCE,
} from "@/lib/report-problem-help-copy-guard";
import {
  SUPPORT_CONTACT_WORKFLOW,
  SUPPORT_PAGE_GUIDANCE,
  SUPPORT_REPORT_PROBLEM_SUMMARY,
} from "@/lib/support-workspace-present";

describe("report-problem-help-copy-guard (TB-790)", () => {
  it("flags support overclaim phrases", () => {
    expect(findReportProblemSupportOverclaimPhrases("We monitor reports 24/7")).toContain("24/7");
    expect(findReportProblemSupportOverclaimPhrases("Immediate response within hours")).toEqual(
      expect.arrayContaining(["immediate response", "within hours"]),
    );
  });

  it("keeps canonical SLA copy on settings support surfaces", () => {
    const surfaces = [SUPPORT_PAGE_GUIDANCE, SUPPORT_CONTACT_WORKFLOW, SUPPORT_REPORT_PROBLEM_SUMMARY];

    for (const surface of surfaces) {
      expect(findReportProblemSupportOverclaimPhrases(surface)).toEqual([]);
      expect(includesReportProblemSlaCopy(surface) || surface.includes("Report problem")).toBe(true);
    }

    expect(REPORT_PROBLEM_HELP_SLA_SENTENCE).toContain("next business day");
  });
});
