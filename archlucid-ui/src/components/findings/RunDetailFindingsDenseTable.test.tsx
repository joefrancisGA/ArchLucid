import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailFindingsDenseTable } from "@/components/findings/RunDetailFindingsDenseTable";
import { OPERATOR_LIST_VIRTUALIZE_MIN_ROWS } from "@/lib/operator/operator-list-virtualization";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function sampleFinding(index: number): QuickDecisionFinding {
  return {
    findingId: `finding-${index}`,
    title: `Risk ${index}`,
    recommendation: "Review",
    severityValue: 1,
    findingOrder: index,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    confidenceLevel: "High",
    insightDensityScore: 70,
  };
}

describe("RunDetailFindingsDenseTable", () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;

    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get(): number {
        return 512;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get(): number {
        return 512;
      },
    });
  });

  it("renders a virtualized table for 50-row fixtures", () => {
    const findings = Array.from({ length: OPERATOR_LIST_VIRTUALIZE_MIN_ROWS }, (_, index) => sampleFinding(index));

    render(<RunDetailFindingsDenseTable runId="run-1" findings={findings} showDensityScore />);

    expect(screen.getByTestId("run-detail-findings-virtual-scroll")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Review findings" })).toBeInTheDocument();
    const mountedTitles = screen.queryAllByText(/^Risk \d+$/);
    expect(mountedTitles.length).toBeGreaterThan(0);
    expect(mountedTitles.length).toBeLessThan(findings.length);
  });

  it("renders all rows in the DOM for small lists", () => {
    const findings = Array.from({ length: 5 }, (_, index) => sampleFinding(index));

    render(<RunDetailFindingsDenseTable runId="run-1" findings={findings} />);

    expect(screen.queryByTestId("run-detail-findings-virtual-scroll")).toBeNull();
    expect(screen.getByTestId("run-detail-findings-dense-table")).toBeInTheDocument();
    expect(screen.getAllByText(/^Risk \d+$/)).toHaveLength(5);
  });
});
