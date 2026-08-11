import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { ReportProblemHelpOrientationStack } from "@/components/help/ReportProblemHelpOrientationStack";
import { REPORT_A_PROBLEM_HELP_PRIMARY_ACTION } from "@/lib/report-a-problem-help-evidence-copy";
import { findReportProblemSupportOverclaimPhrases } from "@/lib/report-problem-help-copy-guard";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView report a problem", () => {
  const loaded = tryLoadProductDocumentation("report-a-problem");

  it("loads report-a-problem markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("documents captured fields, consent, and attributed SLA without overclaim", () => {
    if (loaded === null) {
      throw new Error("Expected report-a-problem documentation to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={loaded.entry}
        markdown={loaded.markdown}
        evidenceOrientation={<ReportProblemHelpOrientationStack />}
      />,
    );

    const text = document.body.textContent ?? "";

    expect(screen.getByRole("heading", { level: 1, name: "Report a problem" })).toBeInTheDocument();
    expect(text).toMatch(/next business day/i);
    expect(text).toMatch(/2026-07-15/);
    expect(text).toMatch(/correlation id/i);
    expect(text).toMatch(/does not auto-attach/i);
    expect(text.toLowerCase()).not.toContain("owner commitment");
    expect(text.toLowerCase()).not.toContain("settings → support");
    expect(text.toLowerCase()).not.toContain("activity log");
    expect(findReportProblemSupportOverclaimPhrases(text)).toEqual([]);

    const primary = screen.getByTestId(REPORT_A_PROBLEM_HELP_PRIMARY_ACTION.testId);
    expect(primary).toHaveAttribute("href", REPORT_A_PROBLEM_HELP_PRIMARY_ACTION.href);
    expect(primary).toHaveTextContent(REPORT_A_PROBLEM_HELP_PRIMARY_ACTION.label);

    expect(screen.getByTestId("report-a-problem-help-support-email").textContent).toContain(
      ARCHLUCID_SUPPORT_EMAIL,
    );
    expect(screen.getByTestId("report-a-problem-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-surface-coverage")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toBeInTheDocument();
  });
});
