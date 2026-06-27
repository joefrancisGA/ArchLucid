import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const PROCUREMENT_SOURCE = "docs/go-to-market/PROCUREMENT_FAQ.md";

const EXPECTED_TOC_LABELS = [
  "Assurance status",
  "Assurance and security",
  "SOC 2 status",
  "Penetration testing",
  "Data residency",
  "SSO providers",
  "SLA",
  "DPA",
  "Subprocessors",
  "Escrow",
  "Insurance",
  "References",
  "Custom policy packs",
  "Available documents",
  "Assurance roadmap",
] as const;

describe("HelpTopicMarkdownView procurement FAQ", () => {
  const loaded = tryLoadProductDocumentation("procurement");

  it("loads procurement FAQ markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("uses short buyer-safe TOC labels without question-mark artifacts", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const tocTitles = headings.map((heading) => heading.title);

    for (const label of EXPECTED_TOC_LABELS) {
      expect(tocTitles).toContain(label);
    }

    expect(tocTitles.some((title) => title.includes("?"))).toBe(false);
    expect(tocTitles.some((title) => /Do you have|Can we see|Where is customer/i.test(title))).toBe(false);
  });

  it("does not expose internal enablement headings in rendered copy", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByText(/Canonical assurance wording/i)).toBeNull();
    expect(screen.queryByText(/Trust progression timeline/i)).toBeNull();
    expect(screen.queryByText(/Tenant\.DataRegion/i)).toBeNull();
    expect(screen.queryByText(/V1\.1-program/i)).toBeNull();
  });

  it("renders assurance status summary for buyers", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Assurance status" })).toBeInTheDocument();
    expect(screen.getAllByText(/Available now/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Available during enterprise procurement/i).length).toBeGreaterThan(0);
  });

  it("renders every right-side TOC item as an anchor to an existing section id", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const toc = screen.getByRole("navigation", { name: "On this page" });

    for (const heading of headings) {
      const link = within(toc).getByRole("link", { name: heading.title });

      expect(link).toHaveAttribute("href", `#${heading.id}`);
    }
  });
});
