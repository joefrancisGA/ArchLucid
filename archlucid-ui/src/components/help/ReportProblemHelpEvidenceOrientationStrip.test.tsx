import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectClaimDisciplineBandContent,
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { ReportProblemHelpEvidenceOrientationStrip } from "@/components/help/ReportProblemHelpEvidenceOrientationStrip";
import {
  REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
  REPORT_A_PROBLEM_HELP_SOURCES,
} from "@/lib/report-a-problem-help-evidence-copy";

describe("ReportProblemHelpEvidenceOrientationStrip", () => {
  it("renders Where to go next follow-ups without duplicate claim discipline or admin destinations", () => {
    render(<ReportProblemHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "report-a-problem-help",
      "report-a-problem-help-claim-discipline",
      REPORT_A_PROBLEM_HELP_CLAIM_DISCIPLINE,
    );

    const sources = screen.getByTestId("report-a-problem-help-sources");
    expect(sources.textContent).toContain("Troubleshooting");
    expect(sources.textContent).not.toContain("(Admin)");

    expectWhereToGoNextFollowUpLinks(screen, REPORT_A_PROBLEM_HELP_SOURCES);
  });
});
