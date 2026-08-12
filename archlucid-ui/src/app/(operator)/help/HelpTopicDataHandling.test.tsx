import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView data-handling", () => {
  const loaded = tryLoadProductDocumentation("data-handling");

  it("loads data-handling markdown from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Data handling and tenant isolation");
  });

  it("renders isolation, AI provider, and optional connector sections", () => {
    if (loaded === null) {
      throw new Error("Expected data-handling documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("heading", { level: 1, name: "Data handling and tenant isolation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Isolation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cloud connectors are optional" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI provider handling" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What ArchLucid does not collect" })).toBeInTheDocument();
    expect(screen.getAllByText(/approved AI provider/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/such as Azure OpenAI/i)).toBeInTheDocument();
    expect(screen.queryByText(/SOC 2 Type II attestation/i)).toBeNull();
  });

  it("renders soft isolation copy without absolute cross-tenant product-design claim (TB-1653)", () => {
    if (loaded === null) {
      throw new Error("Expected data-handling documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath);

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown).not.toMatch(/cross-tenant data access is not part of the product design/i);
    expect(visible).toContain("standard customer path");
    expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
  });
});
