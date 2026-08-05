import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiTelemetryCard } from "@/components/RoiTelemetryCard";

const emptySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

function periodInput(overrides?: {
  severity?: { critical: number; high: number; medium: number };
  blocks?: number;
}) {
  return {
    report: {
      fromUtc: "2026-06-08T00:00:00.000Z",
      toUtc: "2026-07-08T00:00:00.000Z",
      totalRunsCommitted: 1,
      findingsBySeverity: {
        ...emptySeverity,
        critical: overrides?.severity?.critical ?? 0,
        high: overrides?.severity?.high ?? 0,
        medium: overrides?.severity?.medium ?? 0,
      },
    },
    blocks: { count: overrides?.blocks ?? 0, exact: true },
  };
}

describe("RoiTelemetryCard", () => {
  it("uses sponsor-friendly window labels without UTC jargon", () => {
    render(<RoiTelemetryCard window="rolling30" period={periodInput()} hourlyUsd={150} isDefaultRate />);

    expect(screen.getByText(/Rolling 30 days: Jun 8, 2026 – Jul 7, 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/toUtc/i)).toBeNull();
    expect(screen.queryByText(/Model:/)).toBeNull();
  });

  it("shows findings, blocks, and confidence instead of implementation copy", () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        period={periodInput({ severity: { critical: 1, high: 0, medium: 0 }, blocks: 2 })}
        hourlyUsd={150}
        isDefaultRate
      />,
    );

    expect(screen.getByText("Findings counted")).toBeInTheDocument();
    expect(screen.getByText("Governance blocks")).toBeInTheDocument();
    expect(screen.getByText(/Confidence:/)).toBeInTheDocument();
    expect(screen.getByText("$1,800")).toBeInTheDocument();
  });

  it("labels sampled governance blocks", () => {
    render(
      <RoiTelemetryCard
        window="rolling30"
        period={{
          ...periodInput(),
          blocks: { count: 400, exact: false },
        }}
        hourlyUsd={150}
        isDefaultRate
      />,
    );

    expect(screen.getByText(/400 \(sampled\)/)).toBeInTheDocument();
  });
});
