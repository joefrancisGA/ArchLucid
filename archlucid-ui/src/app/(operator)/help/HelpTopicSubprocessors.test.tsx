import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView subprocessors", () => {
  const loaded = tryLoadProductDocumentation("subprocessors");

  it("loads subprocessors documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Subprocessors");
  });

  it("renders subprocessors help without contributor repo paths (TB-1752)", () => {
    if (loaded === null) {
      throw new Error("Expected subprocessors documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "subprocessors",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("start_here");
    expect(preparedMarkdown.toLowerCase()).not.toContain("infra/");
    expect(preparedMarkdown.toLowerCase()).not.toContain("terraform-azure");
    expect(visible).not.toContain("related documents");
    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /dpa template/i }).length).toBeGreaterThan(0);
  });
});
