import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView sponsor-report", () => {
  const loaded = tryLoadProductDocumentation("sponsor-report");

  it("loads sponsor-report from sponsor sponsor brief sections", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Sponsor report");
  });

  it("renders sponsor-report without eng/GTM leakage (TB-1738)", () => {
    if (loaded === null) {
      throw new Error("Expected sponsor-report documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "sponsor-report",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("explainabilitytrace");
    expect(preparedMarkdown.toLowerCase()).not.toContain("m-245");
    expect(visible).toContain("what pilot proves");
    expect(visible).toContain("sponsor roi methodology");
  });
});
