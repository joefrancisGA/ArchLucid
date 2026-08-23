import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedReviewWorkspaceShell } from "@/components/architecture/ArchitectureCreatedReviewWorkspaceShell";
import { REVIEW_WORKSPACE_ROOT_TEST_ID } from "@/components/reviews/ReviewWorkspaceShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
}));

vi.mock("@/components/architecture/ArchitectureDiagramPanel", () => ({
  ArchitectureDiagramPanel: () => null,
}));

describe("ArchitectureCreatedReviewWorkspaceShell (TB-2367)", () => {
  it("wraps create-home workspace with review workspace shell lifecycle metadata", () => {
    render(
      <ArchitectureCreatedReviewWorkspaceShell
        baseline={{
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
        }}
        architectureSourceText=""
        canEditDiagram
        findings={[]}
        correctionHref={null}
        panels={{
          findings: null,
          evidence: null,
          governance: null,
          activity: null,
          submittedArchitecture: null,
        }}
      />,
    );

    const shell = screen.getByTestId(REVIEW_WORKSPACE_ROOT_TEST_ID);

    expect(shell).toHaveAttribute("data-workspace-lifecycle", "create-home");
    expect(screen.getByTestId("architecture-created-workspace")).toBeInTheDocument();
  });
});
