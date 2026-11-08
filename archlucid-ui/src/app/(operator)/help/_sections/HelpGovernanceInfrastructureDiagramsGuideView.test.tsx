import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/help/governance-infrastructure-diagrams",
  useRouter: (): { push: () => void; replace: () => void } => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: (): URLSearchParams =>
    new URLSearchParams("helpGovernanceInfrastructureDiagramsSourcesOpen=1"),
}));

import { HelpGovernanceInfrastructureDiagramsGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureDiagramsGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HELP_RETURN,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PARTITIONED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_LINKS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-diagrams-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-diagrams-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpGovernanceInfrastructureDiagramsGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-diagrams");

  it("renders orientation strip, sections, and related links (TB-2090: no breadcrumbs)", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-infrastructure-diagrams documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDiagramsGuideView entry={entry} />);

    expect(screen.getByTestId("help-governance-infrastructure-diagrams-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-infrastructure-diagrams-page-title")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PAGE_TITLE,
    );
    expect(
      screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", "#help-governance-infrastructure-diagrams-primary-content");
    expect(screen.getAllByTestId("help-governance-infrastructure-diagrams-orientation-strip")).toHaveLength(1);
    expect(screen.getAllByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE).length).toBeGreaterThan(0);
    expect(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE).not.toMatch(/architecture findings/i);
    expect(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_CLAIM_DISCIPLINE).not.toMatch(/architecture-review diagram intake/i);
    expect(screen.getByTestId("help-governance-infrastructure-diagrams-partitioned-body")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_PARTITIONED_BODY,
    );
    expect(screen.getByTestId("help-governance-infrastructure-diagrams-png-body")).toHaveTextContent(
      /browser-rendered PNG/i,
    );

    for (const heading of GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-governance-infrastructure-diagrams-related-topics");
    for (const topic of GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-governance-infrastructure-diagrams-return-to-help")).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_HELP_HELP_RETURN.href,
    );
  });
});
