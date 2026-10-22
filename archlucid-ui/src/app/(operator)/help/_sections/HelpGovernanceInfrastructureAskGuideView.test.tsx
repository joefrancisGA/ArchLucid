import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceInfrastructureAskGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureAskGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_ASK_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-ask-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-ask-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureAskGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-ask");

  it("renders breadcrumb, orientation strip, sections, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-ask documentation entry.");
    }

    render(<HelpGovernanceInfrastructureAskGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-ask-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Infrastructure Ask");
    expect(screen.getByTestId("help-governance-infrastructure-ask-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_ASK_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_ASK_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-ask-primary-content");
    expect(screen.getAllByTestId("help-governance-infrastructure-ask-orientation-strip")).toHaveLength(1);
    expect(screen.getAllByText(GOVERNANCE_INFRASTRUCTURE_ASK_HELP_CLAIM_DISCIPLINE).length).toBeGreaterThan(0);
    expect(screen.getByTestId("help-governance-infrastructure-ask-citations-body")).toHaveTextContent(
      /citation-backed/i,
    );
    expect(screen.getByTestId("help-governance-infrastructure-ask-simulator-body")).toHaveTextContent(/deterministic demo/i);

    for (const heading of GOVERNANCE_INFRASTRUCTURE_ASK_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-governance-infrastructure-ask-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_ASK_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-ask-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_ASK_HELP_HELP_RETURN.href,
    );
  });
});
