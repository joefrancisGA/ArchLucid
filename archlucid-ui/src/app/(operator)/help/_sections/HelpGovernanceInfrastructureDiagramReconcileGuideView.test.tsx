import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceInfrastructureDiagramReconcileGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureDiagramReconcileGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-diagram-reconcile-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-diagram-reconcile-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureDiagramReconcileGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-diagram-reconcile");

  it("renders breadcrumb, orientation strip, sections, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-diagram-reconcile documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDiagramReconcileGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-diagram-reconcile-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Diagram reconciliation");
    expect(screen.getByTestId("help-governance-infrastructure-diagram-reconcile-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-diagram-reconcile-primary-content");
    expect(screen.getAllByTestId("help-governance-infrastructure-diagram-reconcile-orientation-strip")).toHaveLength(1);
    expect(screen.getAllByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_CLAIM_DISCIPLINE).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByTestId("help-governance-infrastructure-diagram-reconcile-correspondence-body")).toHaveTextContent(
      /confidence band/i,
    );
    expect(screen.getByTestId("help-governance-infrastructure-diagram-reconcile-empty-body")).toHaveTextContent(
      /No saved reconciliation/i,
    );

    for (const heading of GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-governance-infrastructure-diagram-reconcile-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-diagram-reconcile-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_HELP_HELP_RETURN.href,
    );
  });
});
