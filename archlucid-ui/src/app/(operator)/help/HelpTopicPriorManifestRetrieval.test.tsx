import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView prior-manifest-retrieval", () => {
  const loaded = tryLoadProductDocumentation("prior-manifest-retrieval");

  it("loads prior-manifest retrieval help from customer guide source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Prior manifest retrieval");
  });

  it("renders prior-manifest help without host config keys (TB-1733)", () => {
    if (loaded === null) {
      throw new Error("Expected prior-manifest-retrieval documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "prior-manifest-retrieval",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("retrieval:priormanifest");
    expect(preparedMarkdown.toLowerCase()).not.toContain("maxpriormanifestsperindex");
    expect(visible).toContain("five");
    expect(screen.getAllByRole("link", { name: /pilot guide/i }).length).toBeGreaterThan(0);
  });
});
