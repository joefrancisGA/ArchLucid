import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView data-handling-tenant-isolation", () => {
  const loaded = tryLoadProductDocumentation("data-handling-tenant-isolation");

  it("loads tenant-isolation help from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Data handling and tenant isolation");
  });

  it("renders three-layer isolation without contributor repo paths (TB-1659)", () => {
    if (loaded === null) {
      throw new Error("Expected data-handling-tenant-isolation documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("buyer_security_procurement_packet");
    expect(visible).not.toContain("scripts/");
    expect(visible).toContain("three layers");
    expect(visible).toContain("sql row-level security is not the production isolation boundary");
    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
  });
});
