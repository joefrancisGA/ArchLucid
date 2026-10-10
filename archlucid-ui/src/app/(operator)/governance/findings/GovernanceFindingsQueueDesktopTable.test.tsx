import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { GovernanceFindingsQueueDesktopTable } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable";
import { GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS } from "@/app/(operator)/governance/findings/governance-findings-queue-virtualization";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";

let searchQuery = "";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    useSearchParams: () => new URLSearchParams(searchQuery),
  });
});

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: () => ({
    mode: "Simulator",
    isSimulator: true,
    isLoading: false,
  }),
}));

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

const resourceGroupA =
  "/subscriptions/sub/resourceGroups/rg-a/providers/Microsoft.Storage/storageAccounts/sa1";
const resourceGroupB =
  "/subscriptions/sub/resourceGroups/rg-b/providers/Microsoft.Storage/storageAccounts/sa2";

function rowForResource(index: number, resourceId: string): GovernanceFindingQueueRow {
  return {
    ...sampleRow(index),
    resourceId,
  };
}

describe("GovernanceFindingsQueueDesktopTable", () => {
  beforeEach(() => {
    searchQuery = "";

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

  it("explains confidence is not used on decision rows", () => {
    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[{ ...sampleRow(0), recordKind: "decision" }]}
        buyerPolishedShell={true}
      />,
    );

    expect(screen.getByText("Not used on decision rows")).toBeInTheDocument();
  });

  it("does not expose decision rows to findings bulk selection", () => {
    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[{ ...sampleRow(0), recordKind: "decision" }]}
        buyerPolishedShell={false}
        selectedFindingIds={new Set()}
        onSelectionChange={() => {}}
      />,
    );

    expect(screen.queryByRole("checkbox", { name: "Select finding: Risk 0" })).toBeNull();
  });

  it("keeps remaining resource groups expanded when disclosure URL references a filtered-out group", () => {
    const staleGroupKey = `resource:${resourceGroupA}`;
    searchQuery = `${GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM}=${encodeURIComponent(staleGroupKey)}`;

    const { rerender } = render(
      <GovernanceFindingsQueueDesktopTable
        rows={[rowForResource(0, resourceGroupA), rowForResource(1, resourceGroupB)]}
        buyerPolishedShell={false}
        groupByResource
      />,
    );

    rerender(
      <GovernanceFindingsQueueDesktopTable
        rows={[rowForResource(1, resourceGroupB)]}
        buyerPolishedShell={false}
        groupByResource
      />,
    );

    const remainingGroupKey = `resource:${resourceGroupB}`;
    const remainingGroup = screen.getByTestId(`governance-findings-resource-group-${remainingGroupKey}`);
    expect(remainingGroup).toHaveAttribute("open");
  });
});
