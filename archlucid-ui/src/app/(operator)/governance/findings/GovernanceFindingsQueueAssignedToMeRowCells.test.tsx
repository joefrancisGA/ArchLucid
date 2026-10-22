import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueAssignedToMeRowCells } from "./GovernanceFindingsQueueAssignedToMeRowCells";
import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

vi.mock("next/navigation", () => ({
  usePathname: () => "/security/assigned-to-me",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

describe("GovernanceFindingsQueueAssignedToMeRowCells", () => {
  it("shows framework control when policyRuleId is stored on the row", () => {
    render(
      <table>
        <tbody>
          <tr>
            <GovernanceFindingsQueueAssignedToMeRowCells
              row={baseRow({ policyRuleId: "SC-28" })}
              showNewSinceLastVisit={false}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByTestId("governance-table-control-finding-1")).toHaveTextContent("Framework control: SC-28");
  });

  it("renders finding title without inspect link when run id is blank", () => {
    render(
      <table>
        <tbody>
          <tr>
            <GovernanceFindingsQueueAssignedToMeRowCells
              row={baseRow({ runId: "   ", title: "Encrypt storage at rest" })}
              showNewSinceLastVisit={false}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.queryByRole("link", { name: "Encrypt storage at rest" })).toBeNull();
    expect(screen.getByText("Encrypt storage at rest")).toBeInTheDocument();
  });

  it("does not show framework control when policyRuleId is absent", () => {
    render(
      <table>
        <tbody>
          <tr>
            <GovernanceFindingsQueueAssignedToMeRowCells row={baseRow()} showNewSinceLastVisit={false} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.queryByTestId("governance-table-control-finding-1")).not.toBeInTheDocument();
  });
});
