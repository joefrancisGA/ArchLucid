import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: true,
}));

const coverageQueryMock = vi.hoisted(() => ({
  data: {
    progressSummary: {
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    },
    buyerSummary: { graphSnapshot: { nodes: [{ nodeType: "service" }] } },
    manifestSummary: null,
  } as const,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-ask-run-coverage-honesty-query", () => ({
  useAskRunCoverageHonestyQuery: () => coverageQueryMock,
}));

import { AskRunCoverageHonestyStrip } from "@/components/ask/AskRunCoverageHonestyStrip";

describe("AskRunCoverageHonestyStrip (WA-07)", () => {
  it("renders quiet-engine honesty when bundle data is available", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<AskRunCoverageHonestyStrip runId="run-abc" />);

    expect(screen.getByTestId("run-detail-seal-desk-coverage-strip")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-seal-desk-quiet-engines-line")).toBeInTheDocument();
  });

  it("renders nothing when runId is blank", () => {
    const { container } = render(<AskRunCoverageHonestyStrip runId="   " />);

    expect(container).toBeEmptyDOMElement();
  });
});
