import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import { ExecutiveReviewsListClient } from "./ExecutiveReviewsListClient";

const runs: RunSummary[] = [
  {
    runId: "run-alpha",
    description: "Claims Intake Modernization",
    createdUtc: "2026-01-01T00:00:00.000Z",
    findingCount: 3,
    hasGoldenManifest: true,
  } as RunSummary,
  {
    runId: "run-beta",
    description: "Payments Platform Review",
    createdUtc: "2026-02-01T00:00:00.000Z",
    findingCount: 1,
    hasGoldenManifest: true,
  } as RunSummary,
];

describe("ExecutiveReviewsListClient", () => {
  it("filters reviews by headline and run id", () => {
    render(<ExecutiveReviewsListClient runs={runs} />);

    expect(screen.getByText("Claims Intake Modernization")).toBeInTheDocument();
    expect(screen.getByText("Payments Platform Review")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter reviews"), { target: { value: "payments" } });

    expect(screen.queryByText("Claims Intake Modernization")).toBeNull();
    expect(screen.getByText("Payments Platform Review")).toBeInTheDocument();
  });
});
