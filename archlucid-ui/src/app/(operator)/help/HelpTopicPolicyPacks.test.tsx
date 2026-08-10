import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const BANNED_DIAGRAM_COPY = [
  "EffectiveGovernance",
  "ArchLucid.Decisioning",
  "Governance / advisory engine",
  "LLM draft",
  "Critic review",
] as const;

describe("HelpTopicMarkdownView policy-packs", () => {
  const loaded = tryLoadProductDocumentation("policy-packs");

  it("loads policy-packs help from customer guide source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Policy packs");
    expect(loaded?.entry.sourcePaths).toContain("docs/library/customer-facing/POLICY_PACKS_OPERATOR_GUIDE.md");
  });

  it("shows hierarchical merge diagram in the default viewport without disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected policy-packs documentation to load.");
    }

    render(<HelpTopicMarkdownView entry={loaded.entry} markdown={loaded.markdown} showContextualHelp />);

    expect(screen.getByRole("heading", { name: "How conflicts are resolved" })).toBeInTheDocument();

    const mermaid = screen.getByTestId("mermaid-diagram");
    expect(mermaid).toHaveTextContent("subgraph assign");
    expect(mermaid).toHaveTextContent("Tenant scope");
    expect(mermaid).toHaveTextContent("Workspace scope");
    expect(mermaid).toHaveTextContent("Project scope");
    expect(mermaid).toHaveTextContent("project beats workspace beats tenant");
    expect(mermaid).toHaveTextContent("Effective rules for this review");

    const diagramText = mermaid.textContent ?? "";

    for (const phrase of BANNED_DIAGRAM_COPY) {
      expect(diagramText, `diagram should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
