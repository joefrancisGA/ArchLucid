import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportAProblemHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ReportAProblemHelpEvidenceOrientationStrip";
import {
  REPORT_A_PROBLEM_HELP_CANONICAL_PATH,
  REPORT_A_PROBLEM_HELP_SOURCES,
} from "@/lib/report-a-problem-help-evidence-copy";

describe("ReportAProblemHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking report-a-problem help", () => {
    render(<ReportAProblemHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("report-a-problem-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("report-a-problem-help-claim-discipline")).toBeInTheDocument();

    for (const link of REPORT_A_PROBLEM_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      REPORT_A_PROBLEM_HELP_SOURCES.some((link) => link.href === REPORT_A_PROBLEM_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
