import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpReportAProblemGuideView } from "@/app/(operator)/help/_sections/HelpReportAProblemGuideView";
import { findReportProblemSupportOverclaimPhrases } from "@/lib/report-problem-help-copy-guard";
import {
  REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_TEST_ID,
  REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS,
  REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_TEST_ID,
} from "@/lib/report-a-problem-help-guide-content";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpReportAProblemGuideView", () => {
  const loaded = tryLoadProductDocumentation("report-a-problem");

  it("loads report-a-problem markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("renders specialty support chrome with dead-end honesty and deferred capture fields (TB-1741–TB-1745)", () => {
    if (loaded === null) {
      throw new Error("Expected report-a-problem documentation to load.");
    }

    render(<HelpReportAProblemGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const text = document.body.textContent ?? "";

    expect(screen.getByTestId("help-report-a-problem-page-title")).toHaveTextContent("Report a problem");
    expect(screen.getByTestId("help-report-a-problem-no-trigger-callout").textContent).toMatch(
      /does not open report problem/i,
    );
    expect(text.toLowerCase()).not.toContain("click report problem here");
    expect(text.toLowerCase()).not.toContain("settings → support");
    expect(text.toLowerCase()).not.toContain("owner commitment");
    expect(findReportProblemSupportOverclaimPhrases(text)).toEqual([]);

    const openSupport = screen.getByTestId(REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.testId);
    expect(openSupport).toHaveAttribute("href", REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.openSupport.href);
    expect(openSupport).toHaveTextContent("Open Support");

    expect(screen.getByTestId(REPORT_A_PROBLEM_HELP_PRIMARY_ACTIONS.emailSupport.testId)).toHaveAttribute(
      "href",
      `mailto:${ARCHLUCID_SUPPORT_EMAIL}`,
    );
    expect(screen.getByTestId("report-a-problem-help-support-email").textContent).toContain(
      ARCHLUCID_SUPPORT_EMAIL,
    );

    expect(screen.getByTestId("help-report-a-problem-job-matrix-current")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-surface-coverage")).toBeInTheDocument();
    expect(screen.getByTestId(REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId("help-report-a-problem-deferred-body")).toBeNull();

    const whereSection = screen.getByTestId(REPORT_A_PROBLEM_HELP_WHERE_IT_APPEARS_TEST_ID);
    const deferredDetails = screen.getByTestId(REPORT_A_PROBLEM_HELP_DEFERRED_DETAILS_TEST_ID);

    expect(
      whereSection.compareDocumentPosition(deferredDetails) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByTestId("help-report-a-problem-related-help")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toBeInTheDocument();
  });
});
