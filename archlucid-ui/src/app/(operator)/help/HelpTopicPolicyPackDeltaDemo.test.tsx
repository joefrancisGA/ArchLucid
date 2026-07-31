import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpTopicMarkdownView policy-pack-delta-demo", () => {
  const loaded = tryLoadProductDocumentation("policy-pack-delta-demo");

  it("loads policy-pack-delta demo help from GTM demo script source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Policy-pack delta demo (internal runbook)");
  });

  it("renders policy-pack-delta demo without HTTP/script leakage (TB-1727)", () => {
    if (loaded === null) {
      throw new Error("Expected policy-pack-delta-demo documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "policy-pack-delta-demo",
    });

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("demo-policy-pack-delta");
    expect(preparedMarkdown.toLowerCase()).not.toContain("precommitgateenabled");
    expect(preparedMarkdown.toLowerCase()).not.toContain("/v1/");
    expect(visible).toContain("policy packs");
    expect(screen.getAllByRole("link", { name: /pre commit governance gate/i }).length).toBeGreaterThan(0);
  });
});
