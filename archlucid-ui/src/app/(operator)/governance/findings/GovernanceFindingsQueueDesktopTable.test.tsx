import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { GovernanceFindingsQueueDesktopTable } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable";
import { GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS } from "@/app/(operator)/governance/findings/governance-findings-queue-virtualization";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  };
});

function sampleRow(index: number): GovernanceFindingQueueRow {
  return {
    runId: `run-${index}`,
    runLabel: `Review ${index}`,
    manifestId: `manifest-${index}`,
    findingId: `finding-${index}`,
    title: `Risk ${index}`,
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Review with owner.",
    recordKind: "finding",
  };
}

describe("GovernanceFindingsQueueDesktopTable", () => {
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

  it("renders a non-virtual scroll container for large flat lists", () => {
    const rows = Array.from({ length: GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS }, (_, index) =>
      sampleRow(index),
    );

    render(<GovernanceFindingsQueueDesktopTable rows={rows} buyerPolishedShell={false} />);

    const scrollRegion = screen.getByTestId("governance-findings-queue-virtual-scroll");
    expect(scrollRegion).toBeInTheDocument();
    expect(scrollRegion.className).toMatch(/overflow-auto/);

    const mountedRiskTitles = screen.queryAllByText(/^Risk \d+$/);
    expect(mountedRiskTitles.length).toBeGreaterThan(0);
    expect(mountedRiskTitles.length).toBeLessThan(rows.length);
  });

  it("renders all rows in the DOM for small flat lists", () => {
    const rows = Array.from({ length: GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS - 1 }, (_, index) =>
      sampleRow(index),
    );

    render(<GovernanceFindingsQueueDesktopTable rows={rows} buyerPolishedShell={false} />);

    expect(screen.queryByTestId("governance-findings-queue-virtual-scroll")).toBeNull();

    const table = screen.getByRole("table", { name: "Findings" });
    const renderedRows = within(table).getAllByRole("row");

    expect(renderedRows).toHaveLength(rows.length + 1);
  });
});
