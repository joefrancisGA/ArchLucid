import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const SHORT_HELP_MARKDOWN = `## Quick start

Use this page when you need a short answer.

- Upload evidence before you finalize.
- Keep the review scoped.

## Related guides

- [Troubleshooting](/help/troubleshooting)
`;

describe("HelpTopicMarkdownView shared layout", () => {
  it("renders shorter help topics without a right-side TOC", () => {
    const entry = getProductDocumentationEntry("troubleshooting");

    if (entry === null) {
      throw new Error("Expected troubleshooting help entry.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={SHORT_HELP_MARKDOWN} />);

    expect(screen.getByRole("heading", { level: 1, name: entry.title })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-content")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).toBeNull();
  });

  it("applies help presentation spacing to headings and lists", () => {
    const entry = getProductDocumentationEntry("troubleshooting");

    if (entry === null) {
      throw new Error("Expected troubleshooting help entry.");
    }

    const { container } = render(<HelpTopicMarkdownView entry={entry} markdown={SHORT_HELP_MARKDOWN} />);

    const h2 = screen.getByRole("heading", { level: 2, name: "Quick start" });

    expect(h2.className).toContain("mt-10");

    const list = container.querySelector("ul");

    expect(list?.className).toContain("my-4");
    expect(list?.className).toContain("space-y-1.5");
  });

  it("shows browser print export for public PDF-eligible topics", () => {
    const entry = getProductDocumentationEntry("sponsor-report");

    if (entry === null || entry.pdfStatus !== "public") {
      throw new Error("Expected sponsor-report to be a public PDF-eligible help entry.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={SHORT_HELP_MARKDOWN} />);

    expect(screen.getByTestId("help-topic-export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toHaveTextContent("Print / Save as PDF");
  });
});
