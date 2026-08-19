import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceDriftOpenResolvedChart } from "@/components/ComplianceDriftOpenResolvedChart";

describe("ComplianceDriftOpenResolvedChart", () => {
  it("shows empty state when no points", () => {
    render(<ComplianceDriftOpenResolvedChart points={[]} />);

    expect(screen.getByText(/no compliance drift findings activity/i)).toBeInTheDocument();
  });

  it("renders accessible chart label and legend for open vs resolved", () => {
    const points = [
      {
        bucketUtc: "2026-04-01T00:00:00.000Z",
        changeCount: 0,
        changesByType: {},
        openFindingsCount: 2,
        resolvedFindingsCount: 1,
      },
      {
        bucketUtc: "2026-04-02T00:00:00.000Z",
        changeCount: 0,
        changesByType: {},
        openFindingsCount: 1,
        resolvedFindingsCount: 3,
      },
    ];

    render(<ComplianceDriftOpenResolvedChart points={points} />);

    expect(
      screen.getByRole("img", {
        name: /opened vs resolved counts per day/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/opened \(findings captured\)/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved \(human review\)/i)).toBeInTheDocument();
  });
});
