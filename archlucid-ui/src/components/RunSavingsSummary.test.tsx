import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunSavingsSummary } from "@/components/RunSavingsSummary";

vi.mock("@/hooks/use-pilot-roi-baseline-completeness", () => ({
  usePilotRoiBaselineCompleteness: vi.fn(),
}));

import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";

const model = {
  annualizedUsd: 900,
  basisFootnotes: ["footnote"],
  sourceKind: "static-demo" as const,
};

describe("RunSavingsSummary", () => {
  it("renders a loading placeholder instead of a dollar amount while baselines load", () => {
    vi.mocked(usePilotRoiBaselineCompleteness).mockReturnValue({
      loading: true,
      complete: null,
      reload: vi.fn(),
    });

    render(<RunSavingsSummary model={model} isFinalized />);

    expect(screen.getByTestId("run-savings-summary-loading")).toBeInTheDocument();
    expect(screen.queryByText("$900")).not.toBeInTheDocument();
    expect(screen.queryByTestId("run-savings-summary-amount")).not.toBeInTheDocument();
  });

  it("shows not yet quantified when ROI baselines are missing on a finalized review", () => {
    vi.mocked(usePilotRoiBaselineCompleteness).mockReturnValue({
      loading: false,
      complete: false,
      reload: vi.fn(),
    });

    render(<RunSavingsSummary model={model} isFinalized />);

    expect(screen.getByTestId("run-savings-summary-not-quantified")).toBeInTheDocument();
    expect(screen.queryByText("$900")).not.toBeInTheDocument();
  });

  it("shows the dollar amount when baselines are complete", () => {
    vi.mocked(usePilotRoiBaselineCompleteness).mockReturnValue({
      loading: false,
      complete: true,
      reload: vi.fn(),
    });

    render(<RunSavingsSummary model={model} isFinalized />);

    expect(screen.getByTestId("run-savings-summary-amount")).toBeInTheDocument();
    expect(screen.getByText("$900")).toBeInTheDocument();
  });
});
