import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help-index.generated";
import {
  humanizeMarkdownFileReference,
  prepareHelpMarkdownForPresentation,
  resolveRelativeRepoDocPath,
  rewriteHelpMarkdownDocLinks,
  sanitizeBareMarkdownFileReferences,
} from "@/lib/help-markdown-presentation";
import { HELP_TOPIC_BANNED_COPY_PATTERNS } from "@/lib/help-product-language";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { HELP_TOPICS } from "@/lib/help-topics";

describe("help-markdown-presentation", () => {
  it("humanizes repo filenames without extensions", () => {
    expect(humanizeMarkdownFileReference("OPERATOR_ATLAS.md")).toBe("Workspace route map");
    expect(humanizeMarkdownFileReference("../runbooks/FIRST_PILOT_OPERATOR_PATH.md")).toBe(
      "Complete review workflow",
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

    expect(rewritten).toBe("See [Product Packaging](/help/billing-and-plans) for details.");
    expect(rewritten.includes(".md")).toBe(false);
  });

  it("preserves same-page anchor links and internal operator routes", () => {
    const source = [
      "- **[Configure SSO](#workforce-sso)**",
      "- **[Connect Azure securely](/help/cloud-connections/azure)**",
      "- [`/integrations/cloud-connections`](/integrations/cloud-connections)",
    ].join("\n");
    const rewritten = rewriteHelpMarkdownDocLinks(
      source,
      "docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md",
    );

    expect(rewritten).toContain("[Configure SSO](#workforce-sso)");
    expect(rewritten).toContain("[Connect Azure securely](/help/cloud-connections/azure)");
    expect(rewritten).toContain("[Cloud Connections](/integrations/cloud-connections)");
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
      "Long-form tables remain in **Deployment decision guide**; see Pre Commit Governance Gate.",
    );
    expect(sanitized.includes(".md")).toBe(false);
  });

  it("prepares operator-shell excerpts without raw md references", () => {
    const excerpt =
      "**Workspace route map:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md). Onboarding: **[`CORE_PILOT.md`](../CORE_PILOT.md)**.";
    const prepared = prepareHelpMarkdownForPresentation(excerpt, "docs/library/operator-shell.md");

    expect(prepared.includes(".md")).toBe(false);
    expect(prepared).toContain("[Workspace route map](/help/operator-shell)");
    expect(prepared).toMatch(/\[Core Pilot\]\(\/help\/core-pilot\)/);
  });

  it("applies review-package product language and migrates legacy /runs/ links", () => {
    const source =
      "An empty artifact list can be valid: manifest exists but none stored for that manifest. See [/runs/new](/runs/new).";
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/library/operator-shell.md");

    expect(prepared).toContain("review package exists");
    expect(prepared).toContain("](/reviews/new)");
    expect(prepared.includes("manifest exists")).toBe(false);
    expect(prepared.includes("/runs/")).toBe(false);
  });

  it("rewrites legacy manifest/run jargon during help presentation", () => {
    const source =
      "manifest exists for that manifest; golden manifest summary; RunId=abc; run not ready; open /runs/abc.";
    const prepared = prepareHelpMarkdownForPresentation(source, "docs/runbooks/TROUBLESHOOTING.md").toLowerCase();

    expect(prepared).toContain("reviewid=abc");
    expect(prepared).toContain("/reviews/abc");
    for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
      expect(prepared, `should not contain "${pattern}"`).not.toContain(pattern);
    }
  });
});

describe("help topic product-language drift guards", () => {
  const SCOPED_ARCHITECT_HELP_SLUGS = [
    "operator-shell",
    "pilot-nav-profile",
    "troubleshooting",
    "admin-diagnostics",
    "review-guide",
  ] as const;

  it("loads scoped architect help topics without operator persona in prepared copy", () => {
    for (const slug of SCOPED_ARCHITECT_HELP_SLUGS) {
      const loaded = tryLoadProductDocumentation(slug);

      expect(loaded, slug).not.toBeNull();

      const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
      const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath);
      const proseOnly = prepared
        .replace(/\]\(\/help\/[^)]+\)/gi, "]")
        .replace(/`[^`]*`/g, "")
        .toLowerCase();

      expect(proseOnly, slug).not.toMatch(/\boperator\b/);
      expect(proseOnly, slug).not.toContain("runbook");
    }
  });

  it("keeps static help topic catalog free of banned manifest/run fragments", () => {
    for (const topic of HELP_TOPICS) {
      const corpus = [topic.title, topic.summary, ...topic.keywords].join(" ").toLowerCase();

      for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
        expect(corpus, `${topic.id} should not contain "${pattern}"`).not.toContain(pattern);
      }

      expect(corpus, `${topic.id} should not contain "operator"`).not.toContain("operator");
    }
  });

  it("keeps generated help search excerpts free of banned manifest/run fragments", () => {
    for (const record of HELP_DOC_SEARCH_RECORDS) {
      const corpus = [record.sectionHeading, record.excerpt].join(" ").toLowerCase();

      for (const pattern of HELP_TOPIC_BANNED_COPY_PATTERNS) {
        expect(corpus, `${record.docPath}#${record.sectionSlug} should not contain "${pattern}"`).not.toContain(
          pattern,
        );
      }
    }
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

    expect(screen.getByRole("link", { name: "Product Packaging" })).toHaveAttribute("href", "/help/billing-and-plans");
    expect(screen.queryByText(/\.md/i)).toBeNull();
  });

  it("does not render internal change set labels in help mode", () => {
    const markdownBody = "# Architect workspace map (Change Set 55R)\n\n## What it is\n\nBody copy.";
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

  it("renders same-page anchor links in onboarding hub bullets", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody={[
          "## Onboarding hub {#onboarding-hub}",
          "",
          "- **[Configure SSO](#workforce-sso)**",
          "- **[Assign policy packs](#default-policy-packs)**",
          "",
          "## Workforce SSO {#workforce-sso}",
          "",
          "SSO body.",
          "",
          "## Default policy packs {#default-policy-packs}",
          "",
          "Policy body.",
        ].join("\n")}
        tableCaption="Enterprise onboarding checklist reference table"
        presentation="help"
        sourceDocPath="docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"
      />,
    );

    expect(screen.getByRole("link", { name: "Configure SSO" })).toHaveAttribute("href", "#workforce-sso");
    expect(screen.getByRole("link", { name: "Assign policy packs" })).toHaveAttribute("href", "#default-policy-packs");
    expect(screen.getByRole("heading", { level: 2, name: "Workforce SSO" })).toHaveAttribute("id", "workforce-sso");
  });

  it("renders internal operator settings links from help markdown", () => {
    render(
      <MarketingAccessibilityMarkdownFragment
        markdownBody="Open [`/integrations/cloud-connections`](/integrations/cloud-connections)."
        tableCaption="Test table"
        presentation="help"
        sourceDocPath="docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md"
      />,
    );

    expect(screen.getByRole("link", { name: "Cloud Connections" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
  });
});
