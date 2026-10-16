import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceInfrastructureResourcesGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureResourcesGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-resources-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-resources-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureResourcesGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-resources");

  it("renders breadcrumb, orientation strip, sections, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-resources documentation entry.");
    }

    render(<HelpGovernanceInfrastructureResourcesGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-resources-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Resource explorer");
    expect(screen.getByTestId("help-governance-infrastructure-resources-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-resources-primary-content");
    expect(screen.getAllByTestId("help-governance-infrastructure-resources-orientation-strip")).toHaveLength(1);
    expect(screen.getAllByText(GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_CLAIM_DISCIPLINE).length).toBeGreaterThan(0);

    for (const heading of GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-governance-infrastructure-resources-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-resources-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_RESOURCES_HELP_HELP_RETURN.href,
    );
  });
});
