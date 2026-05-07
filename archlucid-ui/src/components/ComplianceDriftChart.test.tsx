import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceDriftChart } from "@/components/ComplianceDriftChart";

describe("ComplianceDriftChart", () => {
  it("shows empty state when no points", () => {
    render(<ComplianceDriftChart points={[]} />);

    expect(screen.getByText(/no compliance drift data/i)).toBeInTheDocument();
  });

  it("renders accessible chart label and bars for data", () => {
    const points = [
      {
        bucketUtc: "2026-04-01T00:00:00.000Z",
        changeCount: 2,
        changesByType: { Created: 2 },
      },
      {
        bucketUtc: "2026-04-02T00:00:00.000Z",
        changeCount: 1,
        changesByType: { Assigned: 1 },
      },
    ];

    render(<ComplianceDriftChart points={points} />);

    expect(
      screen.getByRole("img", {
        name: /compliance drift trend/i,
      }),
    ).toBeInTheDocument();
  });

  it("treats non-finite change counts as zero without breaking layout", () => {
    const points = [
      {
        bucketUtc: "2026-04-01T00:00:00.000Z",
        changeCount: Number.NaN,
        changesByType: { Created: Number.NaN },
      },
      {
        bucketUtc: "2026-04-02T00:00:00.000Z",
        changeCount: 4,
        changesByType: { Updated: 4 },
      },
    ];

    render(<ComplianceDriftChart points={points} />);

    expect(
      screen.getByRole("img", {
        name: /compliance drift trend/i,
      }),
    ).toBeInTheDocument();
  });
});
