import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ArchitectureCreatedWorkspace } from "@/components/architecture/ArchitectureCreatedWorkspace";
import { REVIEW_WORKSPACE_TAB_STRIP_TEST_ID } from "@/components/reviews/ReviewWorkspaceShell";
import {
  ARCHITECTURE_CREATED_ACTIVITY_SKIP_LINK_LABEL,
  ARCHITECTURE_CREATED_ACTIVITY_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-created-activity-page-copy";
import {
  ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_LINK_LABEL,
  ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-created-clarifications-page-copy";
import {
  ARCHITECTURE_CREATED_DIAGRAM_SKIP_LINK_LABEL,
  ARCHITECTURE_CREATED_DIAGRAM_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-created-diagram-page-copy";
import {
  ARCHITECTURE_CREATED_OVERVIEW_SKIP_LINK_LABEL,
  ARCHITECTURE_CREATED_OVERVIEW_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-created-overview-page-copy";
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

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
  };
});

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: false,
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
  beforeEach(() => {
    demoEnvMock.buyerPolished = false;
    searchParamsState.value = new URLSearchParams("fromGeneration=1&intent=create-architecture");
  });

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
    expect(screen.getByTestId("review-detail-workspace-tabs")).toBeInTheDocument();
    expect(screen.getByTestId(REVIEW_WORKSPACE_TAB_STRIP_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-workspace-panel-overview")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-workspace-panel-findings")).toHaveAttribute("hidden");
  });

  it("hides overview vocabulary rail and mounts buyer Sources in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

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

    const workspace = screen.getByTestId("architecture-created-workspace");
    const overviewPanel = screen.getByTestId("architecture-workspace-panel-overview");

    expect(screen.getByRole("link", { name: ARCHITECTURE_CREATED_OVERVIEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_CREATED_OVERVIEW_SKIP_TARGET_ID}`,
    );
    expect(
      screen
        .getByRole("link", { name: ARCHITECTURE_CREATED_OVERVIEW_SKIP_LINK_LABEL })
        .compareDocumentPosition(within(workspace).getByTestId("architecture-created-workspace-header")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(overviewPanel).queryByTestId("overview-diagram-vocabulary")).not.toBeInTheDocument();
    expect(
      within(overviewPanel)
        .getByTestId(ARCHITECTURE_CREATED_OVERVIEW_SKIP_TARGET_ID)
        .compareDocumentPosition(within(overviewPanel).getByTestId("architecture-overview-submitted-brief")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      within(overviewPanel)
        .getByTestId("architecture-workspace-overview-panel")
        .compareDocumentPosition(within(overviewPanel).getByTestId("architecture-overview-orientation-bottom")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(overviewPanel).queryByTestId("architecture-overview-provenance-legend")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-created-compact-first-viewport")).not.toBeInTheDocument();
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

    expect(screen.getByTestId("review-detail-workspace-tab-decisions-remediation")).toHaveTextContent("2");
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

  it("hides clarifications vocabulary rail and mounts buyer Sources in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;
    searchParamsState.value = new URLSearchParams(
      "fromGeneration=1&intent=create-architecture&reviewTab=decisions-remediation",
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

    const clarificationsPanel = screen.getByTestId("architecture-workspace-panel-clarifications");

    expect(screen.getByRole("link", { name: ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_TARGET_ID}`,
    );
    expect(within(clarificationsPanel).queryByTestId("clarifications-findings-vocabulary")).not.toBeInTheDocument();
    expect(within(clarificationsPanel).getByTestId(ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_TARGET_ID)).toBeInTheDocument();
    expect(within(clarificationsPanel).getByTestId("architecture-clarifications-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();

    searchParamsState.value = new URLSearchParams("fromGeneration=1&intent=create-architecture");
  });

  it("hides activity vocabulary rail and mounts buyer Sources in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;
    searchParamsState.value = new URLSearchParams(
      "fromGeneration=1&intent=create-architecture&reviewTab=activity",
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

    const activityPanel = screen.getByTestId("architecture-workspace-panel-activity");

    expect(screen.getByRole("link", { name: ARCHITECTURE_CREATED_ACTIVITY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_CREATED_ACTIVITY_SKIP_TARGET_ID}`,
    );
    expect(within(activityPanel).queryByTestId("package-activity-audit-trail-vocabulary")).not.toBeInTheDocument();
    expect(within(activityPanel).getByTestId("activity-panel-slot")).toBeInTheDocument();
    expect(within(activityPanel).getByTestId("architecture-activity-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();

    searchParamsState.value = new URLSearchParams("fromGeneration=1&intent=create-architecture");
  });

  it("hides diagram vocabulary rail and dual-pane toggle in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;
    searchParamsState.value = new URLSearchParams(
      "fromGeneration=1&intent=create-architecture&reviewTab=architecture",
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

    const diagramPanel = screen.getByTestId("architecture-workspace-panel-diagram");

    expect(screen.getByRole("link", { name: ARCHITECTURE_CREATED_DIAGRAM_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_CREATED_DIAGRAM_SKIP_TARGET_ID}`,
    );
    expect(within(diagramPanel).queryByTestId("overview-diagram-vocabulary")).not.toBeInTheDocument();
    expect(within(diagramPanel).queryByTestId("architecture-findings-dual-pane-toggle")).not.toBeInTheDocument();
    expect(within(diagramPanel).getByTestId("architecture-diagram-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();

    searchParamsState.value = new URLSearchParams("fromGeneration=1&intent=create-architecture");
  });
});
