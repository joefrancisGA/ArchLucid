import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ValueReportEvidenceOrientationStrip } from "@/app/(operator)/value-report/_sections/ValueReportEvidenceOrientationStrip";
import {
  EXECUTIVE_SUMMARY_CANONICAL_PATH,
  EXECUTIVE_SUMMARY_SOURCES,
} from "@/lib/executive-summary-evidence-copy";

describe("ValueReportEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking executive summary", () => {
    render(<ValueReportEvidenceOrientationStrip />);

    expect(screen.getByTestId("value-report-sources")).toBeInTheDocument();
    expect(screen.getByTestId("value-report-claim-discipline")).toHaveTextContent(
      /Period summary|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("value-report-sources");

    for (const link of EXECUTIVE_SUMMARY_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(EXECUTIVE_SUMMARY_SOURCES.some((link) => link.href === EXECUTIVE_SUMMARY_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
