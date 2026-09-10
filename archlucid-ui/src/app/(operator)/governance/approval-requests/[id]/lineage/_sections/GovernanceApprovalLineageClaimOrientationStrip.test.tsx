import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceApprovalLineageClaimOrientationStrip } from "@/app/(operator)/governance/approval-requests/[id]/lineage/_sections/GovernanceApprovalLineageClaimOrientationStrip";
import { APPROVAL_LINEAGE_SOURCES } from "@/lib/approval-lineage-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("GovernanceApprovalLineageClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<GovernanceApprovalLineageClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("approval-lineage-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("approval-lineage-claim-discipline")).not.toBeInTheDocument();

    for (const link of filterWhereToGoNextFollowUpLinks(APPROVAL_LINEAGE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
