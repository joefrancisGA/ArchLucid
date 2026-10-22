import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceInfrastructureRemediationGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureRemediationGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-remediation-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-remediation-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureRemediationGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-remediation");

  it("renders breadcrumb, orientation strip, sections, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-remediation documentation entry.");
    }

    render(<HelpGovernanceInfrastructureRemediationGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-remediation-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Remediation instances");
    expect(screen.getByTestId("help-governance-infrastructure-remediation-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-remediation-primary-content");
    expect(screen.getAllByTestId("help-governance-infrastructure-remediation-orientation-strip")).toHaveLength(1);
    expect(screen.getAllByText(GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_CLAIM_DISCIPLINE).length).toBeGreaterThan(0);
    expect(screen.getByTestId("help-governance-infrastructure-remediation-execute-body")).toHaveTextContent(
      /advisory guidance only/i,
    );
    expect(screen.getByTestId("help-governance-infrastructure-remediation-empty-body")).toHaveTextContent(
      /operational findings/i,
    );

    for (const heading of GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-governance-infrastructure-remediation-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-remediation-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_REMEDIATION_HELP_HELP_RETURN.href,
    );
  });
});
