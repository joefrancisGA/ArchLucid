import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView pilot-feedback", () => {
  const loaded = tryLoadProductDocumentation("pilot-feedback");

  it("loads pilot-feedback help from product learning source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Pilot feedback (internal runbook)");
  });

  it("renders pilot-feedback without API/SQL leakage (TB-1717)", () => {
    if (loaded === null) {
      throw new Error("Expected pilot-feedback documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "pilot-feedback",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("productlearningpilotsignals");
    expect(preparedMarkdown.toLowerCase()).not.toContain("storageprovider");
    expect(preparedMarkdown.toLowerCase()).not.toContain("/v1/product-learning");
    expect(visible).toContain("trusted");
    expect(screen.getAllByRole("link", { name: /workspace navigation/i }).length).toBeGreaterThan(0);
    expect(visible).not.toContain("storageprovider");
  });
});
