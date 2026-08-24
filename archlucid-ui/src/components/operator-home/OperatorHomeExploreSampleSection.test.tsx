import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { OperatorHomeExploreSampleSection } from "@/components/operator-home/OperatorHomeExploreSampleSection";
import {
  OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
  OPERATOR_HOME_EXPLORE_SAMPLE_LEAD,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA } from "@/lib/golden-sponsor-package-walkthrough";

const committedReviewMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 3,
      hasCommittedArchitectureReview: committedReviewMock.value,
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: workspaceReviewsMock.value,
    hasActionNeededReviews: false,
    openFindingsCount: 0,
    recentRunIds: recentRunIdsMock.value,
    reportWorkspaceReviews: vi.fn(),
  }),
}));

const workspaceReviewsMock = vi.hoisted(() => ({ value: false }));
const recentRunIdsMock = vi.hoisted(() => ({ value: [] as string[] }));
const sampleReviewsVisibleMock = vi.hoisted(() => ({ value: true }));

vi.mock("@/components/SampleReviewsOnOverviewPreferenceProvider", () => ({
  useSampleReviewsOnOverviewVisible: () => sampleReviewsVisibleMock.value,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("OperatorHomeExploreSampleSection", () => {
  it("renders the unified sponsor-package walkthrough when examples are primary", () => {
    committedReviewMock.value = false;
    workspaceReviewsMock.value = false;
    recentRunIdsMock.value = [];

    render(<OperatorHomeExploreSampleSection />);

    expect(screen.getByTestId("operator-home-explore-sample-section")).toBeInTheDocument();

    const title = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_EXPLORE_SAMPLE_HEADING });
    expect(title).toHaveAttribute("id", "operator-home-explore-sample-heading");
    expect(title.className).toContain("text-[15px]");
    expect(title.className).not.toContain("text-lg");

    for (const token of OPERATOR_HOME_CARD_SECTION_HEADING.split(/\s+/)) {
      if (token.length > 0) {
        expect(title.className).toContain(token);
      }
    }

    expect(screen.getByText(OPERATOR_HOME_EXPLORE_SAMPLE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("golden-sponsor-package-walkthrough")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-explore-run-sample-review")).toBeNull();
  });

  it("hides when Recent reviews already lists a sample or tenant row", () => {
    committedReviewMock.value = false;
    workspaceReviewsMock.value = false;
    recentRunIdsMock.value = ["customer-intake-modernization"];

    render(<OperatorHomeExploreSampleSection />);

    expect(screen.queryByTestId("operator-home-explore-sample-section")).toBeNull();
  });

  it("hides once the tenant has a committed architecture review", () => {
    committedReviewMock.value = true;
    recentRunIdsMock.value = [];

    render(<OperatorHomeExploreSampleSection />);

    expect(screen.queryByTestId("operator-home-explore-sample-section")).toBeNull();
  });

  it("hides when the personal preference turns sample reviews off on Overview", () => {
    committedReviewMock.value = false;
    workspaceReviewsMock.value = false;
    recentRunIdsMock.value = [];
    sampleReviewsVisibleMock.value = false;

    render(<OperatorHomeExploreSampleSection />);

    expect(screen.queryByTestId("operator-home-explore-sample-section")).toBeNull();
  });
});