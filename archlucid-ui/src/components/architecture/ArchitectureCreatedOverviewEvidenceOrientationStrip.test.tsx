import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/architecture/reviews/run-1",
    useSearchParams: () => new URLSearchParams("reviewTab=overview"),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import {
  expectFollowUpLink,
  whereToGoNextFollowUpLinksForTests,
} from "@/lib/claim-discipline-test-helpers";
import { ArchitectureCreatedOverviewEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedOverviewEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_OVERVIEW_SOURCES } from "@/lib/architecture/architecture-created-overview-sources";

describe("ArchitectureCreatedOverviewEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedOverviewEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-overview-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-overview-claim-discipline")).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("architecture-overview-sources");

    for (const link of whereToGoNextFollowUpLinksForTests(
      ARCHITECTURE_CREATED_OVERVIEW_SOURCES,
      "/architecture/reviews/run-1",
    )) {
      expectFollowUpLink(within(sourcesSection), link, { rawLabel: true });
    }

    expect(screen.getByText(/not a finalized review record export trail/i)).toBeInTheDocument();
  });
});
