import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    usePathname: () => "/governance/approval-requests/ar-1/lineage",
  });
});

import { GovernanceApprovalLineageClaimOrientationStrip } from "@/app/(operator)/governance/approval-requests/[id]/lineage/_sections/GovernanceApprovalLineageClaimOrientationStrip";
import { APPROVAL_LINEAGE_SOURCES } from "@/lib/approval-lineage-evidence-copy";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("GovernanceApprovalLineageClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<GovernanceApprovalLineageClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("approval-lineage-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("approval-lineage-claim-discipline")).not.toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(
      within(sourcesSection),
      APPROVAL_LINEAGE_SOURCES,
      "/governance/approval-requests/ar-1/lineage",
    );
  });
});
