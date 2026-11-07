import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    usePathname: () => "/architecture/architectures/new",
  });
});

import {
  expectFollowUpLink,
  whereToGoNextFollowUpLinksForTests,
} from "@/lib/claim-discipline-test-helpers";
import { ArchitectureCreatedClarificationsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES } from "@/lib/architecture/architecture-created-clarifications-sources";

describe("ArchitectureCreatedClarificationsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedClarificationsEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-clarifications-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-clarifications-claim-discipline")).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("architecture-clarifications-sources");

    const filtered = whereToGoNextFollowUpLinksForTests(
      ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES,
      "/architecture/architectures/new",
    );

    for (const link of filtered) {
      expectFollowUpLink(within(sourcesSection), link, { rawLabel: true });
    }

    expect(screen.getByText(/not a finalized review record export trail/i)).toBeInTheDocument();
  });
});
