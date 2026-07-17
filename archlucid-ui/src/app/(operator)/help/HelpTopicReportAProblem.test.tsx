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
import { findReportProblemSupportOverclaimPhrases } from "@/lib/report-problem-help-copy-guard";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView report a problem", () => {
  const loaded = tryLoadProductDocumentation("report-a-problem");

  it("loads report-a-problem markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("documents captured fields, consent, and next-business-day SLA without overclaim", () => {
    if (loaded === null) {
      throw new Error("Expected report-a-problem documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const text = document.body.textContent ?? "";

    expect(screen.getByRole("heading", { level: 1, name: "Report a problem" })).toBeInTheDocument();
    expect(text).toMatch(/next business day/i);
    expect(text).toMatch(/correlation id/i);
    expect(text).toMatch(/does not auto-attach/i);
    expect(findReportProblemSupportOverclaimPhrases(text)).toEqual([]);
  });
});
