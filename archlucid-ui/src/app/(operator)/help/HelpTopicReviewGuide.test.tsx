import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { getProductDocumentationEntry, inAppHelpHref } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "review-guide";
const GUIDE_SOURCE = "docs/library/customer-facing/REVIEW_GUIDE.md";

const BANNED_INTERNAL_COPY = [
  "smoke test",
  "demo seed",
  "curl ",
  "support bundle",
  "localhost",
  "static operator",
  "run-of-show",
  "ci decoration",
] as const;

const TOC_SECTION_TITLES = [
  "Name the review",
  "Upload architecture evidence",
  "Add architecture context",
  "Confirm review scope",
  "Start the review",
  "Review findings and evidence",
  "Finalize the review package",
  "Related guides",
] as const;

vi.mock("next/navigation", () => ({
  usePathname: () => "/reviews/new",
}));

describe("Review guide", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers the buyer-safe review guide title and route", () => {
    expect(entry?.title).toBe("Review guide");
    expect(entry?.audience).toBe("buyer");
    expect(inAppHelpHref(GUIDE_SLUG)).toBe("/help/review-guide");
  });

  it("loads user-facing markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded!.markdown.length).toBeGreaterThan(200);
  });

  it("renders the guide without internal pilot or engineering language", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { level: 1, name: "Review guide" })).toBeInTheDocument();

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    expect(visibleText).not.toContain("pilot guide");
    expect(visibleText).not.toMatch(/\b2–3 sentences\b/);

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("renders the seven buyer-facing review steps", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    for (const title of TOC_SECTION_TITLES) {
      if (title === "Related guides") {
        continue;
      }

      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
  });

  it("renders on-this-page navigation headings", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected review guide to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, GUIDE_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    const toc = screen.getByRole("navigation", { name: "On this page" });

    for (const title of TOC_SECTION_TITLES) {
      expect(within(toc).getByRole("link", { name: title })).toBeInTheDocument();
    }

    expect(headings.map((heading) => heading.title)).toEqual(expect.arrayContaining([...TOC_SECTION_TITLES]));
  });
});
