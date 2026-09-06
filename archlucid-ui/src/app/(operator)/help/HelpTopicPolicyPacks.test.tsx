import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";
import { HelpPolicyPacksGuideView } from "@/app/(operator)/help/_sections/HelpPolicyPacksGuideView";
import {
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HELP_PRIMARY_ACTION,
  POLICY_PACKS_HELP_SOURCES,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const BANNED_DIAGRAM_COPY = [
  "EffectiveGovernance",
  "ArchLucid.Decisioning",
  "Governance / advisory engine",
  "LLM draft",
  "Critic review",
] as const;

const BANNED_DELTA_DEMO_COPY = [
  "run-sheet",
  "founder",
  "acceptance checklist",
  "docs/go-to-market",
  "docs/runbooks",
] as const;

describe("HelpPolicyPacksGuideView (HEO)", () => {
  const loaded = tryLoadProductDocumentation("policy-packs");
  const entry = getProductDocumentationEntry("policy-packs");

  it("loads policy-packs help from customer guide source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Policy packs");
    expect(loaded?.entry.sourcePaths).toContain("docs/library/customer-facing/POLICY_PACKS_OPERATOR_GUIDE.md");
  });

  it("declares registry provenance metadata for approval orientation", () => {
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("policy pack assignment and conflict resolution");
  });

  it("renders customer help without folded delta-demo runbook", () => {
    if (loaded === null) {
      throw new Error("Expected policy-packs documentation to load.");
    }

    render(<HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(screen.queryByTestId("help-policy-packs-folded-delta-demo")).toBeNull();
    expect(screen.queryByTestId("help-policy-pack-delta-demo-guide")).toBeNull();

    for (const phrase of BANNED_DELTA_DEMO_COPY) {
      expect(visible, `policy-packs help should not contain "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
  });

  it("renders Evidence orientation, primary action, and single header chrome", () => {
    if (loaded === null) {
      throw new Error("Expected policy-packs documentation to load.");
    }

    render(<HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getAllByRole("heading", { level: 1, name: "Policy packs" })).toHaveLength(1);
    expect(screen.getAllByTestId("help-topic-toc")).toHaveLength(1);
    expect(screen.getByTestId("help-topic-toc")).toHaveAttribute("aria-label", "On this page");

    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("policy-packs-help-claim-discipline")).toBeNull();

    const headerActions = screen.getByTestId("help-policy-packs-header-actions");
    const policyPacksLink = within(headerActions).getByRole("link", {
      name: POLICY_PACKS_HELP_PRIMARY_ACTION.label,
    });

    expect(policyPacksLink).toHaveAttribute("href", POLICY_PACKS_HELP_PRIMARY_ACTION.href);
    expect(screen.getByTestId("help-policy-packs-header-claim-discipline")).toHaveTextContent(
      POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
    );

    const sources = screen.getByTestId("help-policy-packs-sources");
    expect(within(sources).getByRole("heading", { name: POLICY_PACKS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(within(sources), POLICY_PACKS_HELP_SOURCES);
  });

  it("shows hierarchical merge diagram in the default viewport without disclosures", () => {
    if (loaded === null) {
      throw new Error("Expected policy-packs documentation to load.");
    }

    render(<HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />);

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

  it("does not leak bare governance route strings in customer body copy", () => {
    if (loaded === null) {
      throw new Error("Expected policy-packs documentation to load.");
    }

    render(<HelpPolicyPacksGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const content = screen.getByTestId("help-topic-content");

    expect(content.textContent ?? "").not.toContain("/governance/policy-packs");
    expect(content.textContent ?? "").not.toContain("/governance/standards-and-rules");
    expect(within(content).getByRole("link", { name: "Policy packs" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );
    expect(within(content).getByRole("link", { name: "Standards & rules" })).toHaveAttribute(
      "href",
      "/governance/standards-and-rules",
    );
  });
});
