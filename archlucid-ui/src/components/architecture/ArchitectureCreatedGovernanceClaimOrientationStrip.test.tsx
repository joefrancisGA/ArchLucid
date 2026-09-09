import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureCreatedGovernanceClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceClaimOrientationStrip";
import { ARCHITECTURE_CREATED_GOVERNANCE_SOURCES } from "@/lib/architecture/architecture-created-governance-sources";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ArchitectureCreatedGovernanceClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<ArchitectureCreatedGovernanceClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("architecture-governance-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-governance-claim-discipline")).not.toBeInTheDocument();

    for (const link of filterWhereToGoNextFollowUpLinks(ARCHITECTURE_CREATED_GOVERNANCE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
