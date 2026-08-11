import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportProblemAuditVocabularyRail } from "@/components/ReportProblemAuditVocabularyRail";
import {
  REPORT_PROBLEM_AUDIT_AUDIT_LINK,
  REPORT_PROBLEM_AUDIT_COMPACT_LINE,
  REPORT_PROBLEM_AUDIT_HEADING,
  REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK,
  REPORT_PROBLEM_AUDIT_WHY_TWO,
} from "@/lib/report-problem-audit-vocabulary";

describe("ReportProblemAuditVocabularyRail (TB-2267)", () => {
  it("renders report-problem strip with peer link to audit", () => {
    render(<ReportProblemAuditVocabularyRail currentSurfaceId="report-problem" />);

    const strip = screen.getByTestId("report-problem-audit-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "report-problem");
    expect(strip.textContent ?? "").toContain(REPORT_PROBLEM_AUDIT_COMPACT_LINE);

    const peer = screen.getByTestId("report-problem-audit-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPORT_PROBLEM_AUDIT_AUDIT_LINK.label);
    expect(peer).toHaveAttribute("href", REPORT_PROBLEM_AUDIT_AUDIT_LINK.href);
  });

  it("renders audit strip with peer link to report-a-problem", () => {
    render(<ReportProblemAuditVocabularyRail currentSurfaceId="audit" />);

    expect(screen.getByTestId("report-problem-audit-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "audit",
    );

    const peer = screen.getByTestId("report-problem-audit-vocabulary-peer-link");
    expect(peer).toHaveTextContent(REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK.label);
    expect(peer).toHaveAttribute("href", REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ReportProblemAuditVocabularyRail currentSurfaceId="report-problem" variant="full" />,
    );

    const strip = screen.getByTestId("report-problem-audit-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(REPORT_PROBLEM_AUDIT_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REPORT_PROBLEM_AUDIT_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-audit-vocabulary-current")).toHaveTextContent(
      REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK.label,
    );
  });
});
