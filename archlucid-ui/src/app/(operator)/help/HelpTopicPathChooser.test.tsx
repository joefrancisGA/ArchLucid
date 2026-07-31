import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView path-chooser", () => {
  const loaded = tryLoadProductDocumentation("path-chooser");

  it("loads path-chooser help from buyer orientation source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Choose your next step");
  });

  it("renders path-chooser without GTM/runbook repo paths (TB-1712)", () => {
    if (loaded === null) {
      throw new Error("Expected path-chooser documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "path-chooser",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("v1_deferred");
    expect(preparedMarkdown.toLowerCase()).not.toContain("artifacts/");
    expect(visible).toContain("choose your next step");
    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
  });
});
