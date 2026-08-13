import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView executive-summary", () => {
  const loaded = tryLoadProductDocumentation("executive-summary");

  it("loads executive-summary from executive sponsor brief sections", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Executive summary");
  });

  it("renders executive-summary without eng/GTM leakage (TB-1738)", () => {
    if (loaded === null) {
      throw new Error("Expected executive-summary documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "executive-summary",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("explainabilitytrace");
    expect(preparedMarkdown.toLowerCase()).not.toContain("m-245");
    expect(visible).toContain("what pilot proves");
    expect(screen.getAllByRole("link", { name: /pilot roi measurement/i }).length).toBeGreaterThan(0);
  });
});
