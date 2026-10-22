import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  buildDecisionsNeededTiles,
  DecisionsNeededSummaryCard,
} from "@/components/governance/DecisionsNeededSummaryCard";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";

const emptySummary: GovernanceDecisionsNeededSummary = {
  pendingApprovals: 0,
  staleRisks: 0,
  unownedHighSeverityRisks: 0,
  findingsAwaitingEvidence: 0,
  waiversExpiringWithin14Days: 0,
  deferredFindingsDue: 0,
  totalDecisionItems: 0,
};

const busySummary: GovernanceDecisionsNeededSummary = {
  pendingApprovals: 2,
  staleRisks: 1,
  unownedHighSeverityRisks: 3,
  findingsAwaitingEvidence: 4,
  waiversExpiringWithin14Days: 1,
  deferredFindingsDue: 0,
  totalDecisionItems: 11,
};

describe("DecisionsNeededSummaryCard", () => {
  it("renders six tiles when decision items exist", () => {
    render(<DecisionsNeededSummaryCard summary={busySummary} />);

    expect(screen.getByTestId("decisions-needed-summary-card")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByTestId("decisions-needed-tile-pendingApprovals")).toHaveTextContent("2");
  });

  it("shows empty state when totalDecisionItems is zero", () => {
    render(<DecisionsNeededSummaryCard summary={emptySummary} />);

    expect(screen.getByText(/No decisions needed — all risks are current/i)).toBeInTheDocument();
  });

  it("marks waivers expiring tile with caution accent when count is positive", () => {
    const tiles = buildDecisionsNeededTiles(busySummary);
    const waiversTile = tiles.find((tile) => tile.key === "waiversExpiringWithin14Days");

    expect(waiversTile?.cautionAccent).toBe(true);
  });
});
