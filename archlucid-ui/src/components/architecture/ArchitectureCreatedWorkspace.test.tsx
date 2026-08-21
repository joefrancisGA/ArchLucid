import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedWorkspace } from "@/components/architecture/ArchitectureCreatedWorkspace";
import { REVIEW_WORKSPACE_TAB_STRIP_TEST_ID } from "@/components/reviews/ReviewWorkspaceShell";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

const pushMock = vi.fn();
const replaceMock = vi.fn();

const searchParamsState = {
  value: new URLSearchParams("fromGeneration=1&intent=create-architecture"),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => searchParamsState.value,
}));

vi.mock("@/components/architecture/ArchitectureDiagramPanel", () => ({
  ArchitectureDiagramPanel: () => <div data-testid="architecture-diagram-panel-mock" />,
}));

function finding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-default",
    title: "Finding",
    recommendation: "Fix it.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    ...overrides,
  };
}

describe("ArchitectureCreatedWorkspace", () => {
  it("renders header, compact first viewport, and primary tabs", () => {
    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          runId: "run-1",
          architectureName: "Claims platform",
          architectureOverview: "A structured workflow platform for analysts with auditable evidence trails.",
          businessOutcome: "Reduce manual triage time.",
          peopleAndSystems: [{ label: "Analyst", kind: "Human" }],
          ownerLabel: "owner@example.com",
          lastUpdatedLabel: "Jul 11, 2026",
          workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
          assessmentInProgress: false,
          hasArtifacts: false,
          correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          gapAssertion: { businessOutcome: true, peopleAndSystems: true },
          gapSourceCapturedAtUtc: null,
        }}
        architectureSourceText="Generated architecture body"
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
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
    expect(screen.getByTestId(REVIEW_WORKSPACE_TAB_STRIP_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-workspace-panel-overview")).toBeInTheDocument();
    expect(screen.queryByTestId("findings-panel-slot")).not.toBeInTheDocument();
  });

  it("uses compact context bar on governance tab instead of full first viewport", () => {
    searchParamsState.value = new URLSearchParams(
      "fromGeneration=1&intent=create-architecture&reviewTab=policies",
    );

    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          runId: "run-1",
          architectureName: "Claims platform",
          architectureOverview: "A structured workflow platform for analysts with auditable evidence trails.",
          businessOutcome: "Reduce manual triage time.",
          peopleAndSystems: [{ label: "Analyst", kind: "Human" }],
          ownerLabel: "owner@example.com",
          lastUpdatedLabel: "Jul 11, 2026",
          workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
          assessmentInProgress: false,
          hasArtifacts: false,
          correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          gapAssertion: { businessOutcome: true, peopleAndSystems: true },
          gapSourceCapturedAtUtc: null,
        }}
        architectureSourceText="Generated architecture body"
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
        panels={{
          findings: <div data-testid="findings-panel-slot">Findings</div>,
          evidence: <div data-testid="evidence-panel-slot">Evidence</div>,
          governance: <div data-testid="governance-panel-slot">Governance</div>,
          activity: <div data-testid="activity-panel-slot">Activity</div>,
          submittedArchitecture: <div data-testid="submitted-panel-slot">Submitted</div>,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-created-compact-first-viewport")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-panel-slot")).toBeInTheDocument();

    searchParamsState.value = new URLSearchParams("fromGeneration=1&intent=create-architecture");
  });

  it("includes open-question entities in the clarifications tab badge (TB-1838)", () => {
    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          runId: "run-1",
          architectureName: "Claims platform",
          architectureOverview:
            "A structured workflow platform for analysts with Entra ID authentication, auditable evidence trails, and exportable architecture reviews for enterprise tenants.",
          businessOutcome: "Reduce manual triage time and improve auditability for operations teams.",
          peopleAndSystems: [
            { label: "Claims analyst", kind: "Human" },
            { label: "Partner billing API", kind: "Machine" },
          ],
          ownerLabel: "owner@example.com",
          lastUpdatedLabel: "Jul 11, 2026",
          workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
          assessmentInProgress: false,
          hasArtifacts: true,
          correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          gapAssertion: { businessOutcome: true, peopleAndSystems: true },
          gapSourceCapturedAtUtc: null,
        }}
        architectureSourceText={`## Open questions
- Who owns DR failover?
- What is the RPO target?`}
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
        panels={{
          findings: <div data-testid="findings-panel-slot">Findings</div>,
          evidence: <div data-testid="evidence-panel-slot">Evidence</div>,
          governance: <div data-testid="governance-panel-slot">Governance</div>,
          activity: <div data-testid="activity-panel-slot">Activity</div>,
          submittedArchitecture: <div data-testid="submitted-panel-slot">Submitted</div>,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-workspace-tab-clarifications")).toHaveTextContent("2");
  });

  it("demotes compact first-viewport primary action when Do this next owns the page primary", () => {
    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          runId: "run-1",
          architectureName: "Claims platform",
          architectureOverview: "A structured workflow platform for analysts with auditable evidence trails.",
          businessOutcome: "Reduce manual triage time.",
          peopleAndSystems: [{ label: "Analyst", kind: "Human" }],
          ownerLabel: "owner@example.com",
          lastUpdatedLabel: "Jul 11, 2026",
          workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
          assessmentInProgress: false,
          hasArtifacts: false,
          correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          gapAssertion: { businessOutcome: true, peopleAndSystems: true },
          gapSourceCapturedAtUtc: null,
        }}
        architectureSourceText="Generated architecture body"
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
        pagePrimaryOwnedElsewhere
        panels={{
          findings: <div data-testid="findings-panel-slot">Findings</div>,
          evidence: <div data-testid="evidence-panel-slot">Evidence</div>,
          governance: <div data-testid="governance-panel-slot">Governance</div>,
          activity: <div data-testid="activity-panel-slot">Activity</div>,
          submittedArchitecture: <div data-testid="submitted-panel-slot">Submitted</div>,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-created-primary-action").className).toContain("border-neutral-300");
  });

  it("demotes findings next-action when Do this next owns the page primary", () => {
    searchParamsState.value = new URLSearchParams(
      "fromGeneration=1&intent=create-architecture&reviewTab=findings",
    );

    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          runId: "run-1",
          architectureName: "Claims platform",
          architectureOverview: "A structured workflow platform for analysts with auditable evidence trails.",
          businessOutcome: "Reduce manual triage time.",
          peopleAndSystems: [{ label: "Analyst", kind: "Human" }],
          ownerLabel: "owner@example.com",
          lastUpdatedLabel: "Jul 11, 2026",
          workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
          assessmentInProgress: false,
          hasArtifacts: false,
          correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
          gapAssertion: { businessOutcome: true, peopleAndSystems: true },
          gapSourceCapturedAtUtc: null,
        }}
        architectureSourceText="Generated architecture body"
        canEditDiagram
        findings={[finding({ findingId: "f-high", severityValue: 3, findingOrder: 0 })]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
        pagePrimaryOwnedElsewhere
        panels={{
          findings: <div data-testid="findings-panel-slot">Findings</div>,
          evidence: <div data-testid="evidence-panel-slot">Evidence</div>,
          governance: <div data-testid="governance-panel-slot">Governance</div>,
          activity: <div data-testid="activity-panel-slot">Activity</div>,
          submittedArchitecture: <div data-testid="submitted-panel-slot">Submitted</div>,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-findings-triage-primary-action").className).toContain("border-neutral-300");

    searchParamsState.value = new URLSearchParams("fromGeneration=1&intent=create-architecture");
  });
});
