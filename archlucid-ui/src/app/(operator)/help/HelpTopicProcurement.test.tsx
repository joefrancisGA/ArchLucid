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
  "Q & A",
  "1. Do you have SOC 2 Type II?",
  "2. Can we see the latest penetration-test report?",
  "3. Where is customer **data processed / stored**?",
  "4. Can we authenticate with **Okta / Ping / Auth0** instead of Microsoft Entra ID?",
  "5. What **SLA** do you publish?",
  "6. Can we execute the **Data Processing Agreement**?",
  "7. What **subprocessors** apply?",
  "8. What happens if ArchLucid **ceases trading**?",
  "9. Do you maintain **cyber insurance**?",
  "10. Can we speak with **reference customers**?",
  "11. How do we get **extended audit retention** (e.g. 7 years)?",
  "12. Can we **commission custom policy packs** beyond bundled defaults?",
] as const;

describe("HelpTopicMarkdownView procurement FAQ", () => {
  const loaded = tryLoadProductDocumentation("procurement");

  it("loads procurement FAQ markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("uses buyer-safe TOC labels without question-mark artifacts in h3 titles", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, PROCUREMENT_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);
    const tocTitles = headings.map((heading) => heading.title);

    for (const label of EXPECTED_TOC_LABELS) {
      expect(tocTitles).toContain(label);
    }

    expect(tocTitles.some((title) => title.includes("Trust progression timeline"))).toBe(false);
  });

  it("does not expose internal enablement headings in rendered copy", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.queryByText(/Trust progression timeline/i)).toBeNull();
    expect(screen.queryByText(/Tenant\.DataRegion/i)).toBeNull();
    expect(screen.queryByText(/V1\.1-program/i)).toBeNull();
  });

  it("renders procurement FAQ answers for buyers", () => {
    if (loaded === null) {
      throw new Error("Expected procurement documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { name: "Q & A" })).toBeInTheDocument();
    expect(screen.getAllByText(/SOC 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/penetration/i).length).toBeGreaterThan(0);
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
