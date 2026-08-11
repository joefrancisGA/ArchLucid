import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportProblemHelpEvidenceOrientationStrip } from "@/components/help/ReportProblemHelpEvidenceOrientationStrip";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_SOURCES,
} from "@/lib/report-a-problem-help-evidence-copy";

describe("ReportProblemHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-ups with admin tags", () => {
    render(<ReportProblemHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("report-a-problem-help-claim-discipline").textContent).toContain(
      REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
    );

    const sources = screen.getByTestId("report-a-problem-help-sources");
    expect(sources.textContent).toContain("Troubleshooting");
    expect(sources.textContent).toContain("(Admin)");

    for (const link of REPORT_A_PROBLEM_HELP_SOURCES) {
      expect(sources.textContent).toContain(link.label);
    }
  });
});
