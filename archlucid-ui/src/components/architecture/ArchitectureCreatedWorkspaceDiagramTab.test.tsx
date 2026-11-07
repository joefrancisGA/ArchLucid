import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-diagram",
  useSearchParams: () =>
    new URLSearchParams("fromGeneration=1&intent=create-architecture&reviewTab=architecture"),
}));

const useArchitectureDiagramPanelMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/architecture/use-architecture-diagram-panel", () => ({
  useArchitectureDiagramPanel: (...args: unknown[]) => useArchitectureDiagramPanelMock(...args),
}));

vi.mock("@/components/architecture/ArchitectureDiagramReadyView", () => ({
  ArchitectureDiagramReadyView: () => <div data-testid="architecture-diagram-viewer-mock" />,
}));

function diagramPanelStub(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    phase: "ready",
    variant: "full",
    displayMermaidSource: "graph TD;A-->B",
    clarifyHref: "/architecture/reviews/new?path=guided-intake&rerun=run-diagram",
    clarifyArchitectureVariant: "primary",
    missingExplanation: "",
    versionsCount: 0,
    canEdit: true,
    unconfirmedInferredCount: 0,
    diagramModel: {
      nodes: [],
      edges: [],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
    },
    onClarificationsNavigate: undefined,
    onOpenFull: undefined,
    runGeneration: vi.fn(),
    ...overrides,
  };
}

import { ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION } from "@/lib/architecture/architecture-diagram-copy";
import { ArchitectureCreatedWorkspace } from "@/components/architecture/ArchitectureCreatedWorkspace";

const workspaceBaseline = {
  runId: "run-diagram",
  architectureName: "Claims platform",
  architectureOverview: "A structured workflow platform for analysts with auditable evidence trails.",
  businessOutcome: "Reduce manual triage time.",
  peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
  ownerLabel: "owner@example.com",
  lastUpdatedLabel: "Jul 11, 2026",
  workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" as const },
  assessmentInProgress: false,
  hasArtifacts: false,
  correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-diagram",
  gapAssertion: { businessOutcome: true, peopleAndSystems: true },
  gapSourceCapturedAtUtc: null,
};

const architectureSourceText = `## Systems and services
- Claims API
## Users and stakeholders
- Claims analyst
## Data flows
Claims analyst -> Claims API`;

describe("ArchitectureCreatedWorkspace diagram tab", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useArchitectureDiagramPanelMock.mockImplementation(() => diagramPanelStub());
  });

  it("mounts a single diagram panel on the diagram tab without duplicate preview", async () => {
    render(
      <ArchitectureCreatedWorkspace
        baseline={workspaceBaseline}
        architectureSourceText={architectureSourceText}
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-diagram"
        panels={{
          findings: <div>Findings</div>,
          evidence: <div>Evidence</div>,
          governance: <div>Governance</div>,
          activity: <div>Activity</div>,
          submittedArchitecture: <div>Submitted</div>,
        }}
      />,
    );

    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-preview")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-panel")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("heading", { name: "Architecture diagram" })).toHaveLength(1);
    expect(screen.getAllByTestId("architecture-diagram-viewer-mock")).toHaveLength(1);
    expect(screen.getByTestId("architecture-findings-dual-pane-toggle")).toHaveTextContent("Show with findings");
  });

  it("diagram tab Add details links to run-scoped guided intake (TB-1842)", async () => {
    useArchitectureDiagramPanelMock.mockImplementation(() =>
      diagramPanelStub({ phase: "insufficient", displayMermaidSource: null }),
    );

    render(
      <ArchitectureCreatedWorkspace
        baseline={{
          ...workspaceBaseline,
          architectureName: "",
          architectureOverview: "",
          peopleAndSystems: [],
        }}
        architectureSourceText="Too little detail."
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-diagram"
        panels={{
          findings: <div>Findings</div>,
          evidence: <div>Evidence</div>,
          governance: <div>Governance</div>,
          activity: <div>Activity</div>,
          submittedArchitecture: <div>Submitted</div>,
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-diagram-insufficient")).toBeInTheDocument();
    });

    const addDetailsLink = screen.getByRole("link", { name: ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION });
    expect(addDetailsLink.getAttribute("href")).toContain("rerun=run-diagram");
  });
});
