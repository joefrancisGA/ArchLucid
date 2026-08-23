import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  REVIEW_WORKSPACE_ROOT_TEST_ID,
  REVIEW_WORKSPACE_TAB_STRIP_TEST_ID,
  ReviewWorkspaceShell,
} from "@/components/reviews/ReviewWorkspaceShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
}));

vi.mock("@/components/reviews/ReviewDetailWorkspace", () => ({
  ReviewDetailWorkspace: () => <div data-testid="review-detail-workspace-stub" />,
}));

vi.mock("@/components/architecture/ArchitectureDiagramPanel", () => ({
  ArchitectureDiagramPanel: () => null,
}));

describe("ReviewWorkspaceShell (TB-2367)", () => {
  it("renders lifecycle metadata and delegates to ReviewDetailWorkspace", () => {
    render(
      <ReviewWorkspaceShell
        lifecycle="finalized"
        runId="run-1"
        panels={{
          overview: null,
          findings: null,
          evidence: null,
          policies: null,
          decisionsRemediation: null,
          reviewPackage: null,
          architecture: null,
          activity: null,
        }}
      />,
    );

    const shell = screen.getByTestId(REVIEW_WORKSPACE_ROOT_TEST_ID);

    expect(shell).toHaveAttribute("data-workspace-lifecycle", "finalized");
    expect(screen.getByTestId("review-detail-workspace-stub")).toBeInTheDocument();
    expect(REVIEW_WORKSPACE_TAB_STRIP_TEST_ID).toBe("review-workspace-tab-strip");
  });

  it("renders create-home lifecycle through ArchitectureCreatedWorkspace", () => {
    render(
      <ReviewWorkspaceShell
        lifecycle="create-home"
        createHome={{
          baseline: {
            runId: "run-1",
            architectureName: "Claims platform",
            architectureOverview: "Overview",
            businessOutcome: "",
            peopleAndSystems: [],
            ownerLabel: null,
            lastUpdatedLabel: "Jul 11, 2026",
            workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
            assessmentInProgress: false,
            hasArtifacts: false,
            correctionHref: null,
            gapAssertion: { businessOutcome: false, peopleAndSystems: false },
            gapSourceCapturedAtUtc: null,
          },
          architectureSourceText: "",
          canEditDiagram: true,
          findings: [],
          correctionHref: null,
          panels: {
            findings: null,
            evidence: null,
            governance: null,
            activity: null,
            submittedArchitecture: null,
          },
        }}
      />,
    );

    const shell = screen.getByTestId(REVIEW_WORKSPACE_ROOT_TEST_ID);

    expect(shell).toHaveAttribute("data-workspace-lifecycle", "create-home");
    expect(screen.getByTestId("architecture-created-workspace")).toBeInTheDocument();
  });
});
