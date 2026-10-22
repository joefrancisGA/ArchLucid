import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureCreatedEvidenceClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceClaimOrientationStrip";
import { ARCHITECTURE_CREATED_EVIDENCE_SOURCES } from "@/lib/architecture/architecture-created-evidence-sources";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ArchitectureCreatedEvidenceClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<ArchitectureCreatedEvidenceClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("architecture-evidence-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-evidence-claim-discipline")).not.toBeInTheDocument();

    for (const link of filterWhereToGoNextFollowUpLinks(ARCHITECTURE_CREATED_EVIDENCE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
