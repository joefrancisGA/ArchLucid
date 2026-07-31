import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView soc2-self-assessment", () => {
  const loaded = tryLoadProductDocumentation("soc2-self-assessment");

  it("loads SOC2 self-assessment from security source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("SOC 2 self-assessment");
  });

  it("renders SOC2 self-assessment without contributor leakage (TB-1747)", () => {
    if (loaded === null) {
      throw new Error("Expected soc2-self-assessment documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "soc2-self-assessment",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("authsafetyguard");
    expect(preparedMarkdown.toLowerCase()).not.toContain("codeql");
    expect(preparedMarkdown.toLowerCase()).not.toContain("audit_coverage_matrix");
    expect(visible).toContain("self-assessment");
    expect(screen.getAllByRole("link", { name: /caiq/i }).length).toBeGreaterThan(0);
  });

  it("renders SOC2 Type I roadmap without calendar commitments (TB-1748)", () => {
    if (loaded === null) {
      throw new Error("Expected soc2-self-assessment documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "soc2-self-assessment",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("2026-09-01");
    expect(preparedMarkdown.toLowerCase()).not.toContain("2026-q4");
    expect(visible).not.toContain("pending questions");
    expect(visible).toContain("illustrative");
  });
});
