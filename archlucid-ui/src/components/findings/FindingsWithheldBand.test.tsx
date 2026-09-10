import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingsWithheldBand } from "@/components/findings/FindingsWithheldBand";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working", mounted: true }),
}));

describe("FindingsWithheldBand (DR-02)", () => {
  it("renders withheld rows in Working mode", () => {
    render(
      <FindingsWithheldBand
        runId="run-1"
        withheld={[
          {
            withheldFindingId: "emission-r1-f1",
            reason: "prose-only-emission",
            originEngineType: "AgentArchitectureFinding-Compliance",
            originAgentType: "Compliance",
            title: "Unreferenced concern",
            traceTargetId: "result-1",
            conflictFindingId: null,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("findings-withheld-band")).toBeInTheDocument();
    expect(screen.getByText(/Unreferenced concern/)).toBeInTheDocument();
  });
});
