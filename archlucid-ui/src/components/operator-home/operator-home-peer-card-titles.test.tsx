import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OperatorHomeExploreSampleSection } from "@/components/operator-home/OperatorHomeExploreSampleSection";
import { OperatorHomeWorkspaceContextDisclosure } from "@/components/operator-home/OperatorHomeWorkspaceContextDisclosure";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE,
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
  OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
  useNavCallerAuthorityRank: () => 100,
  // PilotCommandCenterCard resolves invitee-reviewer orientation from the nav principal.
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Test Architect",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: 100,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: false,
      permissionClaimValues: [],
    },
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: false,
    hasActionNeededReviews: false,
    openFindingsCount: 0,
    recentRunIds: [],
    reportWorkspaceReviews: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => ({
    phase: "ready",
    context: {
      healthReady: true,
      healthLoadFailed: false,
      principalAdmin: true,
    },
    readyCount: 4,
    totalCount: 4,
  }),
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: vi.fn(),
    reset: vi.fn(),
    isNavigating: false,
    isPending: false,
    activeStageId: null,
    showStagedPanel: false,
    stages: [],
    loadingLabel: "Starting review…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate: vi.fn(),
    reset: vi.fn(),
    isNavigating: false,
    loadingLabel: "Starting architecture…",
    error: null,
  }),
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => null,
  OperatorHomeWorkspaceStatusPanel: () => null,
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");
  const mockModule = await createCorePilotCommitContextModuleMock(importOriginal);
  const fetchCorePilotCommitContext = vi.mocked(mockModule.fetchCorePilotCommitContext);

  fetchCorePilotCommitContext.mockResolvedValue({
    hasCommittedManifest: false,
    committedReviewCount: 0,
    latestRunId: null,
    firstCommittedRunId: null,
    secondCommittedRunId: null,
    latestRunReadyToFinalize: false,
  });

  return mockModule;
});

const emptyRunsDashboard: OperatorHomeRunsDashboardModel = {
  projectId: "default",
  page: 1,
  pageSize: 5,
  items: [],
  totalCount: 0,
  loadFailure: null,
  malformedMessage: null,
  usedStaticRunsFallback: false,
  buyerPolishedShell: false,
};

function expectPeerCardTitleClasses(className: string): void {
  expect(className).toContain("text-[15px]");
  expect(className).not.toContain("text-lg");

  for (const token of OPERATOR_HOME_CARD_SECTION_HEADING.split(/\s+/)) {
    if (token.length > 0) {
      expect(className).toContain(token);
    }
  }
}

describe("operator home peer card titles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("uses shared peer-card title typography for explore sample sections", () => {
    render(<OperatorHomeExploreSampleSection />);

    const exploreSampleTitle = screen.getByRole("heading", {
      level: 2,
      name: OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
    });

    expectPeerCardTitleClasses(exploreSampleTitle.className);
  });

  it("uses the same peer-card title scale for readiness, Workspace metrics, and Explore ArchLucid", () => {
    // Readiness only renders a titled card in its blocker state.
    render(<OperatorHomeContinueSetupCard canBegin={false} blockerMessage={OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER} />);
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} runsDashboard={emptyRunsDashboard} />);
    render(
      <OperatorHomeDisclosureSection
        title={OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}
        titleId="operator-home-advanced-guidance-heading"
        sectionTestId="operator-home-advanced-guidance"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
        defaultExpanded={false}
        density="slim"
        collapsedSummary="Collapsed summary"
      >
        <p>Expanded body</p>
      </OperatorHomeDisclosureSection>,
    );

    for (const name of [OPERATOR_HOME_ONE_REQUIRED_ITEM_TITLE, "Workspace metrics and status", OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE]) {
      expectPeerCardTitleClasses(screen.getByRole("heading", { level: 2, name }).className);
    }
  });
});
