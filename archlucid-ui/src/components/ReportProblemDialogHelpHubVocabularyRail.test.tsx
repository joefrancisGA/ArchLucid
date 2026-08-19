import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportProblemDialogHelpHubVocabularyRail } from "@/components/ReportProblemDialogHelpHubVocabularyRail";
import {
  REPORT_PROBLEM_DIALOG_HELP_HUB_COMPACT_LINE,
  REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK,
  REPORT_PROBLEM_DIALOG_HELP_HUB_HEADING,
  REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK,
  REPORT_PROBLEM_DIALOG_HELP_HUB_WHY_TWO,
} from "@/lib/vocabulary/report-problem-dialog-help-hub-vocabulary";

describe("ReportProblemDialogHelpHubVocabularyRail (TB-2318)", () => {
  it("renders report-problem-dialog strip with peer link to Help", () => {
    render(
      <ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="report-problem-dialog" />,
    );

    const strip = screen.getByTestId("report-problem-dialog-help-hub-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "report-problem-dialog");
    expect(strip.textContent ?? "").toContain(REPORT_PROBLEM_DIALOG_HELP_HUB_COMPACT_LINE);

    const peer = screen.getByTestId("report-problem-dialog-help-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK.label);
    expect(peer).toHaveAttribute("href", REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK.href);
  });

  it("renders help-hub strip with peer link to Report a problem", () => {
    render(<ReportProblemDialogHelpHubVocabularyRail currentSurfaceId="help-hub" />);

    const peer = screen.getByTestId("report-problem-dialog-help-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK.label);
    expect(peer).toHaveAttribute("href", REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ReportProblemDialogHelpHubVocabularyRail
        currentSurfaceId="report-problem-dialog"
        variant="full"
      />,
    );

    expect(screen.getByText(REPORT_PROBLEM_DIALOG_HELP_HUB_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REPORT_PROBLEM_DIALOG_HELP_HUB_WHY_TWO)).toBeInTheDocument();
  });
});
