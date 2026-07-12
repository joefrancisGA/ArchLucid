import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedWorkspace } from "@/components/architecture/ArchitectureCreatedWorkspace";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/reviews/run-1",
  useSearchParams: () => new URLSearchParams("fromGeneration=1&intent=create-architecture"),
}));

vi.mock("@/components/architecture/ArchitectureDiagramPanel", () => ({
  ArchitectureDiagramPanel: () => <div data-testid="architecture-diagram-panel-mock" />,
}));

describe("ArchitectureCreatedWorkspace", () => {
  it("renders header, compact first viewport, and primary tabs", () => {
    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          runId: "run-1",
          architectureName: "Claims platform",
          architectureOverview: "A governed workflow platform for analysts with auditable evidence trails.",
          businessOutcome: "Reduce manual triage time.",
          peopleAndSystems: [{ label: "Analyst", kind: "Human" }],
          ownerLabel: "owner@example.com",
          lastUpdatedLabel: "Jul 11, 2026",
          workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
          assessmentInProgress: false,
          hasArtifacts: false,
        }}
        architectureSourceText="Generated architecture body"
        canEditDiagram
        findings={[]}
        correctionHref="/reviews/new?path=guided-intake&rerun=run-1"
        panels={{
          findings: <div data-testid="findings-panel-slot">Findings</div>,
          evidence: <div data-testid="evidence-panel-slot">Evidence</div>,
          governance: <div data-testid="governance-panel-slot">Governance</div>,
          activity: <div data-testid="activity-panel-slot">Activity</div>,
          submittedArchitecture: <div data-testid="submitted-panel-slot">Submitted</div>,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-created-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-workspace-header")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-compact-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-workspace-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-workspace-panel-overview")).toBeInTheDocument();
    expect(screen.queryByTestId("findings-panel-slot")).not.toBeInTheDocument();
  });
});
