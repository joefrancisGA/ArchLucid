import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  humanizeMarkdownFileReference,
  prepareHelpMarkdownForPresentation,
  resolveRelativeRepoDocPath,
  rewriteHelpMarkdownDocLinks,
  sanitizeBareMarkdownFileReferences,
} from "@/lib/help-markdown-presentation";

describe("help-markdown-presentation", () => {
  it("humanizes repo filenames without extensions", () => {
    expect(humanizeMarkdownFileReference("OPERATOR_ATLAS.md")).toBe("Operator Atlas");
    expect(humanizeMarkdownFileReference("../runbooks/FIRST_PILOT_OPERATOR_PATH.md")).toBe(
      "First Pilot Operator Path",
    );
  });

  it("resolves relative repo doc paths without node:path", () => {
    expect(resolveRelativeRepoDocPath("../OPERATOR_ATLAS.md", "docs/library/operator-shell.md")).toBe(
      "docs/OPERATOR_ATLAS.md",
    );
    expect(resolveRelativeRepoDocPath("OPERATOR_ATLAS.md", "docs/library/operator-shell.md")).toBe(
      "docs/library/OPERATOR_ATLAS.md",
    );
    expect(resolveRelativeRepoDocPath("docs/START_HERE.md", "docs/library/operator-shell.md")).toBe(
      "docs/START_HERE.md",
    );
  });

  it("rewrites mapped markdown links to in-app help routes", () => {
    const source = "See [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) for details.";
    const rewritten = rewriteHelpMarkdownDocLinks(source, "docs/library/operator-shell.md");

    expect(rewritten).toBe("See [Product Packaging](/help/getting-started) for details.");
    expect(rewritten.includes(".md")).toBe(false);
  });

  it("drops unmapped markdown links to plain labels", () => {
    const source = "Contributor note in [BUILD.md](BUILD.md).";
    const rewritten = rewriteHelpMarkdownDocLinks(source, "docs/library/operator-shell.md");

    expect(rewritten).toBe("Contributor note in Build.");
    expect(rewritten.includes(".md")).toBe(false);
  });

  it("sanitizes bare markdown filenames in body copy", () => {
    const source =
      "Long-form tables remain in **OPERATOR_DECISION_GUIDE.md**; see `docs/PRE_COMMIT_GOVERNANCE_GATE.md`.";

    const sanitized = sanitizeBareMarkdownFileReferences(source);

    expect(sanitized).toBe(
      "Long-form tables remain in **Operator Decision Guide**; see Pre Commit Governance Gate.",
    );
    expect(sanitized.includes(".md")).toBe(false);
  });

  it("prepares operator-shell excerpts without raw md references", () => {
    const excerpt =
      "**Canonical route map:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md). Onboarding: **[`CORE_PILOT.md`](../CORE_PILOT.md)**.";
    const prepared = prepareHelpMarkdownForPresentation(excerpt, "docs/library/operator-shell.md");

    expect(prepared.includes(".md")).toBe(false);
    expect(prepared).toContain("[Operator Atlas](/help/operator-shell)");
    expect(prepared).toMatch(/\[Core Pilot\]\(\/help\/core-pilot\)/);
  });

  it("strips internal change set labels and duplicate titles from help markdown", () => {
    const source = [
      "> **Scope:** Contributor-reference — ArchLucid operator shell (Change Set 55R)",
      "",
      "# ArchLucid operator shell (Change Set 55R)",
      "",
      "## What it is",
    ].join("\n");

    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/operator-shell.md");

    expect(prepared.includes("Change Set")).toBe(false);
    expect(prepared.includes("55R")).toBe(false);
    expect(prepared.startsWith("## What it is")).toBe(true);
  });
});

describe("MarketingAccessibilityMarkdownFragment help presentation", () => {
  it("renders in-app help links instead of raw markdown paths", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody="See [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)."
        tableCaption="Test table"
        presentation="help"
        sourceDocPath="docs/library/operator-shell.md"
      />,
    );

    expect(screen.getByRole("link", { name: "Product Packaging" })).toHaveAttribute("href", "/help/getting-started");
    expect(screen.queryByText(/\.md/i)).toBeNull();
  });

  it("does not render internal change set labels in help mode", () => {
    const markdownBody = "# ArchLucid operator shell (Change Set 55R)\n\n## What it is\n\nBody copy.";
    const prepared = prepareHelpMarkdownForPresentation(markdownBody, "docs/library/operator-shell.md");
    expect(prepared).toBe("## What it is\n\nBody copy.");

    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={markdownBody}
        tableCaption="Test table"
        presentation="help"
        sourceDocPath="docs/library/operator-shell.md"
      />,
    );

    expect(screen.queryByText(/Change Set 55R/i)).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "What it is" })).toBeInTheDocument();
  });

  it("routes mermaid fences to the diagram renderer", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={"```mermaid\nflowchart LR\n  A --> B\n```"}
        tableCaption="Test table"
        presentation="help"
      />,
    );

    expect(screen.getByTestId("mermaid-diagram")).toHaveTextContent("flowchart LR");
    expect(screen.queryByRole("button", { name: /copy code/i })).toBeNull();
  });

  it("strips explicit markdown heading anchors from visible help headings", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={`## Workforce SSO {#workforce-sso}

Body copy.`}
        tableCaption="Test table"
        presentation="help"
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Workforce SSO" });

    expect(heading).toHaveAttribute("id", "workforce-sso");
    expect(screen.queryByText(/\{#workforce-sso\}/i)).toBeNull();
  });
});
