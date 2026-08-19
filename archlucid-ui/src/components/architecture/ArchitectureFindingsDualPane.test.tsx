import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureFindingsDualPane } from "@/components/architecture/ArchitectureFindingsDualPane";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

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
      expect.stringContaining("archTab=findings"),
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