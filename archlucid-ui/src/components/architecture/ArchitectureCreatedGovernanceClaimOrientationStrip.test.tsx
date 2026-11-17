import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    usePathname: () => "/architecture/architectures/new",
  });
});

import { ArchitectureCreatedGovernanceClaimOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceClaimOrientationStrip";
import { ARCHITECTURE_CREATED_GOVERNANCE_SOURCES } from "@/lib/architecture/architecture-created-governance-sources";
import { whereToGoNextFollowUpLinksForTests } from "@/lib/claim-discipline-test-helpers";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("ArchitectureCreatedGovernanceClaimOrientationStrip", () => {
  it("lists follow-up Sources without duplicating header claim discipline", () => {
    render(<ArchitectureCreatedGovernanceClaimOrientationStrip />);

    const sourcesSection = screen.getByTestId("architecture-governance-sources");

    expect(sourcesSection).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-governance-claim-discipline")).not.toBeInTheDocument();

    const filtered = whereToGoNextFollowUpLinksForTests(
      ARCHITECTURE_CREATED_GOVERNANCE_SOURCES,
      "/architecture/architectures/new",
    );

    for (const link of filtered) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }
  });
});
