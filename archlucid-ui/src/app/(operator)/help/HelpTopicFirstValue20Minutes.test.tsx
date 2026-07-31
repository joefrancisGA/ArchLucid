import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView first-value-20-minutes", () => {
  const loaded = tryLoadProductDocumentation("first-value-20-minutes");

  it("loads first-value-20 help from the operator runbook source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("First value in 20 minutes (internal runbook)");
  });

  it("renders 20-minute checklist without dotnet project leakage (TB-1693)", () => {
    if (loaded === null) {
      throw new Error("Expected first-value-20-minutes documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "first-value-20-minutes",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("dotnet run --project");
    expect(visible).not.toContain("role_index");
    expect(visible).toContain("first value in 20 minutes");
    expect(visible).toContain("archlucid doctor");
  });
});
