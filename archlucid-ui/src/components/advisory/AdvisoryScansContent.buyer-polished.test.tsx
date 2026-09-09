import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";
import { listRecommendations } from "@/lib/advisory-api";
import type { RecommendationRecord } from "@/types/advisory";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/advisory-scans",
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 0,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 0,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 0,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
}));

vi.mock("@/components/runs/RunIdPicker", () => ({
  RunIdPicker: () => <div data-testid="run-id-picker" />,
}));

vi.mock("@/lib/advisory-api", () => ({
  applyRecommendationAction: vi.fn(),
  listRecommendations: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getImprovementPlan: vi.fn(),
}));

vi.mock("@/hooks/useProductionDeskChrome", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useProductionDeskChrome")>();

  return {
    ...actual,
    useProductionEvalChrome: () => true,
  };
});

function sampleRecommendation(): RecommendationRecord {
  return {
    recommendationId: "rec-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    runId: "run-finalized-1",
    title: "Tighten auth boundary",
    category: "Security",
    rationale: "Evidence from findings",
    suggestedAction: "Require MFA on admin paths",
    urgency: "High",
    expectedImpact: "High",
    priorityScore: 90,
    status: "Open",
    createdUtc: "2026-07-01T00:00:00Z",
    lastUpdatedUtc: "2026-07-01T00:00:00Z",
  };
}

describe("AdvisoryScansContent buyer-polished shell (ADT)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listRecommendations).mockResolvedValue({ recommendations: [sampleRecommendation()] });
  });

  it("hides vocabulary rail and capability boundary below the scans workspace", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    expect(screen.queryByTestId("advisory-results-schedules-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-capability-boundary")).not.toBeInTheDocument();
    expect(screen.getByTestId("advisory-scans-how-it-works")).toBeInTheDocument();
  });
});
