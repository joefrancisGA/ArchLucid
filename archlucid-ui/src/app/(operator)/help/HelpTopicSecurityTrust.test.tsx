import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const SECURITY_TRUST_SOURCE = "docs/go-to-market/trust-center.md";

const EXPECTED_TOC_LABELS = [
  "Assurance status",
  "Security overview",
  "Penetration testing",
  "Data residency and sovereignty",
  "Questionnaire materials",
  "Assurance roadmap",
] as const;

describe("HelpTopicMarkdownView security and trust", () => {
  const loaded = tryLoadProductDocumentation("security-trust");

  it("loads security-trust markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("uses short buyer-safe TOC labels", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, SECURITY_TRUST_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const tocTitles = headings.map((heading) => heading.title);

    for (const label of EXPECTED_TOC_LABELS) {
      expect(tocTitles).toContain(label);
    }
  });

  it("does not expose internal CI or enablement copy in rendered output", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByText(/Canonical assurance wording/i)).toBeNull();
    expect(screen.queryByText(/check_procurement_pack_index/i)).toBeNull();
    expect(screen.queryByText(/Automated freshness posture/i)).toBeNull();
    expect(screen.queryByText(/V1_DEFERRED/i)).toBeNull();
    expect(screen.queryByText(/github\.com\/joefrancisGA/i)).toBeNull();
  });

  it("renders assurance status and links to procurement FAQ", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Assurance status" })).toBeInTheDocument();
    const procurementLinks = screen.getAllByRole("link", { name: "Procurement FAQ" });

    expect(procurementLinks.some((link) => link.getAttribute("href") === "/help/procurement")).toBe(true);
  });

  it("renders every right-side TOC item as an anchor link", () => {
    if (loaded === null) {
      throw new Error("Expected security-trust documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, SECURITY_TRUST_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const toc = screen.getByRole("navigation", { name: "On this page" });

    for (const heading of headings) {
      const link = within(toc).getByRole("link", { name: heading.title });

      expect(link).toHaveAttribute("href", `#${heading.id}`);
    }
  });
});
