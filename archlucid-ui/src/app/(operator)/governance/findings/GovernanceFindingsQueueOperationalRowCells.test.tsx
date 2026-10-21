import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueOperationalRowCells } from "./GovernanceFindingsQueueOperationalRowCells";
import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({
    mode: "Simulator",
    isSimulator: true,
    isLoading: false,
  }),
}));

function baseRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Prod subscription",
    manifestId: "",
    findingId: "finding-1",
    title: "Encrypt storage at rest",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Review finding.",
    recordKind: "finding",
    ...overrides,
  };
}

describe("GovernanceFindingsQueueOperationalRowCells", () => {
  it("does not render policy traceability badges when policyRuleId is whitespace-only", () => {
    render(
      <table>
        <tbody>
          <tr>
            <GovernanceFindingsQueueOperationalRowCells row={baseRow({ policyRuleId: "   " })} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.queryByTestId("finding-policy-traceability-badges")).toBeNull();
    expect(screen.getByText(/Policy area: Security/)).toBeInTheDocument();
  });
});
