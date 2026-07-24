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

const GUIDE_SLUG = "first-hour-operator-path";
const GUIDE_SOURCE = "docs/library/FIRST_HOUR_OPERATOR_PATH.md";

const BANNED_INTERNAL_COPY = [
  "operator",
  "operator shell",
  "in-product affordances",
  "progressive disclosure rules",
  "documentation alignment",
  "permission regression",
] as const;

const TOC_SECTION_TITLES = [
  "Pilot first. Operate later.",
  "Four-step first-review path",
  "What can wait until later",
  "What good looks like",
  "Recommended first session",
  "Related guides",
] as const;

const RELATED_GUIDE_LINKS: ReadonlyArray<{ readonly label: string; readonly href: string }> = [
  { label: "Start a review", href: "/help/evidence-intake" },
  { label: "Architecture packages", href: "/help/review-packages" },
  { label: "Evidence graph", href: "/help/evidence-trail" },
  { label: "Governance approval", href: "/help/governance-approval" },
];

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: () => "/",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

describe("First-review guide", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers the principal-architect guide title and route", () => {
    expect(entry?.title).toBe("First-review guide");
    expect(inAppHelpHref(GUIDE_SLUG)).toBe("/help/first-hour-operator-path");
  });

  it("loads user-facing markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded!.markdown.length).toBeGreaterThan(200);
  });

  it("renders the guide without internal implementation language", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected first-review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { level: 1, name: "First-review guide" })).toBeInTheDocument();

    const visibleText = document.body.textContent?.toLowerCase() ?? "";

    for (const banned of BANNED_INTERNAL_COPY) {
      expect(visibleText, `should not contain "${banned}"`).not.toContain(banned);
    }
  });

  it("renders the four user-facing first-hour steps", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected first-review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByText(/1\. Start a new architecture review/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Review findings/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Finalize the architecture package/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Review artifacts/i)).toBeInTheDocument();
  });

  it("renders user-facing on-this-page navigation headings", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected first-review guide to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, GUIDE_SOURCE);
    const headings = extractHelpMarkdownHeadings(preparedMarkdown);

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    const toc = screen.getByTestId("help-topic-toc");

    for (const title of TOC_SECTION_TITLES) {
      expect(within(toc).getByRole("link", { name: title })).toBeInTheDocument();
    }

    expect(headings.map((heading) => heading.title)).toEqual(expect.arrayContaining([...TOC_SECTION_TITLES]));
  });

  it("renders related guide links when available", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected first-review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    for (const item of RELATED_GUIDE_LINKS) {
      const links = screen.getAllByRole("link", { name: item.label });

      expect(links.some((link) => link.getAttribute("href") === item.href)).toBe(true);
    }
  });

  it("renders shared help layout markers for title, content column, and TOC", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected first-review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-topic-content")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc-heading")).toHaveTextContent("On this page");
    expect(screen.getByText(entry.summary)).toBeInTheDocument();
  });

  it("applies shared section spacing and table styling in help markdown", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected first-review guide to load.");
    }

    render(<HelpTopicMarkdownView entry={entry} markdown={loaded.markdown} />);

    const sectionHeading = screen.getByRole("heading", { level: 2, name: "What can wait until later" });

    expect(sectionHeading.className).toContain("mt-10");

    const table = screen.getByRole("table");

    expect(table).toBeInTheDocument();
    expect(table.querySelector("thead th")?.className).toContain("font-semibold");
  });
});
