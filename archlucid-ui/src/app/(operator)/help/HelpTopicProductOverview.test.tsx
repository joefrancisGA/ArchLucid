import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView product-overview", () => {
  const loaded = tryLoadProductDocumentation("product-overview");

  // TB-1739: product-overview folded into executive-summary — same EXECUTIVE_SPONSOR_BRIEF.md sections apply.
  it("loads product-overview from executive sponsor brief sections", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Executive summary");
  });

  it("renders product-overview without eng/GTM leakage (TB-1738)", () => {
    if (loaded === null) {
      throw new Error("Expected product-overview documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "product-overview",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("explainabilitytrace");
    expect(preparedMarkdown.toLowerCase()).not.toContain("m-245");
    expect(visible).toContain("what pilot proves");
    // TB-1739: aliased executive-summary excerpt covers sections 5-11 only — no Trust Center section in that slice.
    expect(screen.getAllByRole("link", { name: /pilot roi model/i }).length).toBeGreaterThan(0);
  });
});
