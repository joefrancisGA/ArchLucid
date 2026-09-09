import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureCreatedFindingsClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsClaimOrientationStrip";
import { ARCHITECTURE_CREATED_FINDINGS_SOURCES } from "@/lib/architecture/architecture-created-findings-sources";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ArchitectureCreatedFindingsClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<ArchitectureCreatedFindingsClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("architecture-findings-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-findings-claim-discipline")).not.toBeInTheDocument();

    for (const link of filterWhereToGoNextFollowUpLinks(ARCHITECTURE_CREATED_FINDINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
