import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportProblemSupportWorkspaceVocabularyRail } from "@/components/ReportProblemSupportWorkspaceVocabularyRail";
import {
  REPORT_PROBLEM_SUPPORT_WORKSPACE_COMPACT_LINE,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_HEADING,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK,
  REPORT_PROBLEM_SUPPORT_WORKSPACE_WHY_TWO,
} from "@/lib/vocabulary/report-problem-support-workspace-vocabulary";

describe("ReportProblemSupportWorkspaceVocabularyRail (TB-2306)", () => {
  it("renders report-a-problem strip with peer link to support workspace", () => {
    render(
      <ReportProblemSupportWorkspaceVocabularyRail currentSurfaceId="report-a-problem" />,
    );

    const strip = screen.getByTestId("report-problem-support-workspace-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "report-a-problem");
    expect(strip.textContent ?? "").toContain(REPORT_PROBLEM_SUPPORT_WORKSPACE_COMPACT_LINE);

    const peer = screen.getByTestId("report-problem-support-workspace-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK.label);
    expect(peer).toHaveAttribute("href", REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK.href);
  });

  it("renders support-workspace strip with peer link to report a problem", () => {
    render(
      <ReportProblemSupportWorkspaceVocabularyRail currentSurfaceId="support-workspace" />,
    );

    const peer = screen.getByTestId("report-problem-support-workspace-vocabulary-peer-link");
    expect(peer).toHaveTextContent(
      REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK.label,
    );
    expect(peer).toHaveAttribute(
      "href",
      REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK.href,
    );
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ReportProblemSupportWorkspaceVocabularyRail
        currentSurfaceId="report-a-problem"
        variant="full"
      />,
    );

    expect(screen.getByText(REPORT_PROBLEM_SUPPORT_WORKSPACE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REPORT_PROBLEM_SUPPORT_WORKSPACE_WHY_TWO)).toBeInTheDocument();
  });
});
