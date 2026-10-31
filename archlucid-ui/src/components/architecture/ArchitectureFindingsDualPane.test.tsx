import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureFindingsDualPane } from "@/components/architecture/ArchitectureFindingsDualPane";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { REVIEW_DETAIL_FINDING_PARAM } from "@/lib/review-detail-workspace-tabs";

const searchParamsHarness = vi.hoisted(() => ({
  query: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-dual",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.query),
}));

vi.mock("@/hooks/use-working-back-locator", () => ({
  useWorkingBackLocator: () => ({
    architectureDeskHref: "/architecture/architectures/architecture-identity-001",
    reviewJobHref:
      "/architecture/architectures/architecture-identity-001/reviews/run-dual",
  }),
}));

function makeFinding(
  overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId" | "title">,
): QuickDecisionFinding {
  return {
    findingId: overrides.findingId,
    title: overrides.title,
    recommendation: overrides.recommendation ?? "Tighten controls.",
    severityValue: overrides.severityValue ?? 2,
    findingOrder: overrides.findingOrder ?? 0,
    aiReasoning: overrides.aiReasoning ?? {
      wireJson: "{}",
      reasoningTrace: "trace",
    },
    isMuted: overrides.isMuted ?? false,
    muteReason: overrides.muteReason ?? null,
    enforcementTier: overrides.enforcementTier ?? "Advisory",
  };
}

describe("ArchitectureFindingsDualPane", () => {
  beforeEach(() => {
    searchParamsHarness.query = "";
    window.history.replaceState({}, "", "/architecture/reviews/run-dual");
  });

  it("uses a neutral status tag when finding severity was not stored", () => {
    const findings: QuickDecisionFinding[] = [
      {
        ...makeFinding({
          findingId: "f-missing-severity",
          title: "Untyped finding",
        }),
        severityValue: null,
      },
    ];

    render(
      <ArchitectureFindingsDualPane
        runId="run-dual"
        findings={findings}
        diagramNodes={[]}
        diagram={<div>Diagram</div>}
      />,
    );

    expect(screen.getByText("Severity label was not stored.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Critical/i)).not.toBeInTheDocument();
  });

  it("renders linked view with diagram and findings, syncs highlight on select", () => {
    const onHighlightedNodeIdChange = vi.fn();
    const findings: QuickDecisionFinding[] = [
      makeFinding({
        findingId: "f-api",
        title: "Harden Claims API authentication",
        aiReasoning: {
          wireJson: JSON.stringify({ relatedNodeIds: ["claims_api"] }),
          reasoningTrace: "trace",
        },
      }),
      makeFinding({
        findingId: "f-other",
        title: "Document retention policy",
      }),
    ];

    render(
      <ArchitectureFindingsDualPane
        runId="run-dual"
        findings={findings}
        diagramNodes={[
          { id: "claims_api", label: "Claims API" },
          { id: "queue", label: "Queue" },
        ]}
        diagram={<div data-testid="embedded-diagram-island">Diagram island</div>}
        onHighlightedNodeIdChange={onHighlightedNodeIdChange}
      />,
    );

    expect(screen.getByTestId("architecture-findings-dual-pane")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-findings-dual-pane")).toHaveAttribute(
      "data-layout-mode",
      "architecture-findings-linked",
    );
    expect(screen.getByText("Linked view")).toBeInTheDocument();
    expect(screen.getByTestId("embedded-diagram-island")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-findings-dual-pane-findings")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-findings-dual-pane-finding-f-api"));

    expect(screen.getByTestId("architecture-findings-dual-pane-link-status")).toHaveTextContent(
      "Linked component: Claims API",
    );
    expect(onHighlightedNodeIdChange).toHaveBeenCalledWith("claims_api");
    expect(screen.getByRole("link", { name: "Open findings tab" })).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=findings"),
    );
  });

  it("SY-27: falls back to nested pathname when architecture id is known", () => {
    render(
      <ArchitectureFindingsDualPane
        runId="run-dual"
        architectureId="architecture-identity-001"
        findings={[]}
        diagram={<div>Diagram</div>}
      />,
    );

    expect(screen.getByTestId("architecture-findings-dual-pane")).toBeInTheDocument();
  });

  it("hydrates diagram finding selection from useSearchParams when window.location.search lags", () => {
    const findings: QuickDecisionFinding[] = [
      makeFinding({
        findingId: "f-api",
        title: "Harden Claims API authentication",
        aiReasoning: {
          wireJson: JSON.stringify({ relatedNodeIds: ["claims_api"] }),
          reasoningTrace: "trace",
        },
      }),
    ];

    searchParamsHarness.query = `${REVIEW_DETAIL_FINDING_PARAM}=f-api`;
    window.history.replaceState({}, "", "/architecture/reviews/run-dual");

    render(
      <ArchitectureFindingsDualPane
        runId="run-dual"
        findings={findings}
        diagramNodes={[{ id: "claims_api", label: "Claims API" }]}
        diagram={<div>Diagram</div>}
      />,
    );

    expect(screen.getByTestId("architecture-findings-dual-pane-link-status")).toHaveTextContent(
      "Linked component: Claims API",
    );
    expect(screen.getByTestId("architecture-findings-dual-pane-finding-f-api")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("clears diagram finding selection from useSearchParams when runId changes before window catches up", () => {
    const findingsRunA: QuickDecisionFinding[] = [
      makeFinding({
        findingId: "f-api",
        title: "Harden Claims API authentication",
        aiReasoning: {
          wireJson: JSON.stringify({ relatedNodeIds: ["claims_api"] }),
          reasoningTrace: "trace",
        },
      }),
    ];
    const findingsRunB: QuickDecisionFinding[] = [
      makeFinding({
        findingId: "f-other",
        title: "Document retention policy",
      }),
    ];

    searchParamsHarness.query = `${REVIEW_DETAIL_FINDING_PARAM}=f-api`;
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-dual?${REVIEW_DETAIL_FINDING_PARAM}=f-api`,
    );

    const { rerender } = render(
      <ArchitectureFindingsDualPane
        runId="run-dual"
        findings={findingsRunA}
        diagramNodes={[{ id: "claims_api", label: "Claims API" }]}
        diagram={<div>Diagram</div>}
      />,
    );

    expect(screen.getByTestId("architecture-findings-dual-pane-finding-f-api")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    searchParamsHarness.query = "";
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-dual?${REVIEW_DETAIL_FINDING_PARAM}=f-api`,
    );

    rerender(
      <ArchitectureFindingsDualPane
        runId="run-other"
        findings={findingsRunB}
        diagramNodes={[]}
        diagram={<div>Diagram</div>}
      />,
    );

    expect(screen.queryByTestId("architecture-findings-dual-pane-link-status")).toBeNull();
    expect(screen.getByTestId("architecture-findings-dual-pane-finding-f-other")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows empty findings copy when the list is empty", () => {
    render(
      <ArchitectureFindingsDualPane
        runId="run-empty"
        findings={[]}
        diagram={<div>Diagram</div>}
      />,
    );

    expect(screen.getByTestId("architecture-findings-dual-pane-empty")).toBeInTheDocument();
  });
});