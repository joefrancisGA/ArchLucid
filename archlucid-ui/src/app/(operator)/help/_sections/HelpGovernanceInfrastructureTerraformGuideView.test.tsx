import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceInfrastructureTerraformGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureTerraformGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-terraform-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-terraform-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureTerraformGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-terraform");

  it("renders breadcrumb, orientation strip, sections, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-terraform documentation entry.");
    }

    render(<HelpGovernanceInfrastructureTerraformGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-terraform-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Advisory Terraform");
    expect(screen.getByTestId("help-governance-infrastructure-terraform-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-terraform-primary-content");
    expect(screen.getAllByTestId("help-governance-infrastructure-terraform-orientation-strip")).toHaveLength(1);
    expect(screen.getAllByText(GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_CLAIM_DISCIPLINE).length).toBeGreaterThan(0);
    expect(screen.getByTestId("help-governance-infrastructure-terraform-export-body")).toHaveTextContent(
      /not validated for safe cloud apply/i,
    );

    for (const heading of GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-governance-infrastructure-terraform-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-terraform-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_TERRAFORM_HELP_HELP_RETURN.href,
    );
  });
});
