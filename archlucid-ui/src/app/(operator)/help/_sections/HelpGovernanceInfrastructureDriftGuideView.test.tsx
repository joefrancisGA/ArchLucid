import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceInfrastructureDriftGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureDriftGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-drift-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureDriftGuideView (HEG Phase 2)", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-drift");

  it("renders breadcrumb, single orientation strip, applicability, error recovery, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-drift documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDriftGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-drift-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Drift & snapshots");
    expect(screen.getByTestId("help-governance-infrastructure-drift-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-drift-primary-content");
    expect(screen.getByTestId("help-governance-infrastructure-drift-overview").className).toContain(
      HELP_PAGE_LAYOUT.readingBody,
    );
    expect(screen.getAllByTestId("help-governance-infrastructure-drift-orientation-strip")).toHaveLength(1);
    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.queryByTestId("help-governance-infrastructure-drift-honesty-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(/Before sponsor send/i)).not.toBeInTheDocument();

    for (const heading of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    expect(screen.getByTestId("help-governance-infrastructure-drift-applicability")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-infrastructure-drift-error-recovery")).toBeInTheDocument();

    const related = screen.getByTestId("help-governance-infrastructure-drift-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-drift-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HELP_RETURN.href,
    );
  });
});
