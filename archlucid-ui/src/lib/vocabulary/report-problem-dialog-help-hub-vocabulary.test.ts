import { describe, expect, it } from "vitest";

import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { REPORT_PROBLEM_DIALOG_TITLE } from "@/lib/report-problem-copy";
import {
  REPORT_PROBLEM_DIALOG_HELP_HUB_COMPACT_LINE,
  REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK,
  REPORT_PROBLEM_DIALOG_HELP_HUB_HEADING,
  REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK,
  REPORT_PROBLEM_DIALOG_HELP_HUB_WHY_TWO,
  REPORT_PROBLEM_DIALOG_SURFACE_HREF,
  buildReportProblemDialogHelpHubVocabulary,
  resolveReportProblemDialogHelpHubPeerLink,
} from "@/lib/vocabulary/report-problem-dialog-help-hub-vocabulary";

describe("report-problem-dialog-help-hub-vocabulary (TB-2318)", () => {
  it("explains Report a problem dialog vs Help hub", () => {
    const model = buildReportProblemDialogHelpHubVocabulary();

    expect(model.heading).toBe(REPORT_PROBLEM_DIALOG_HELP_HUB_HEADING);
    expect(model.whyTwo).toBe(REPORT_PROBLEM_DIALOG_HELP_HUB_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("dialog");
    expect(model.whyTwo.toLowerCase()).toContain("help");
    expect(model.compactLine).toBe(REPORT_PROBLEM_DIALOG_HELP_HUB_COMPACT_LINE);

    expect(model.reportProblemDialogLink).toEqual(REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK);
    expect(model.reportProblemDialogLink.label).toBe(REPORT_PROBLEM_DIALOG_TITLE);
    expect(model.reportProblemDialogLink.href).toBe(REPORT_PROBLEM_DIALOG_SURFACE_HREF);
    expect(model.helpHubLink).toEqual(REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK);
    expect(model.helpHubLink.href).toBe(HELP_HUB_CANONICAL_PATH);
  });

  it("resolves the peer surface from dialog and help hub", () => {
    expect(resolveReportProblemDialogHelpHubPeerLink("report-problem-dialog")).toEqual(
      REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK,
    );

    expect(resolveReportProblemDialogHelpHubPeerLink("help-hub")).toEqual(
      REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK,
    );
  });
});
