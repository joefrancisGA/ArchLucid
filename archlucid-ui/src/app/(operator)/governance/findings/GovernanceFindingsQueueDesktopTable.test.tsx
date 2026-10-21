import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { GovernanceFindingsQueueDesktopTable } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable";
import { GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS } from "@/app/(operator)/governance/findings/governance-findings-queue-virtualization";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";

let searchQuery = "";
const routerPushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    useSearchParams: () => new URLSearchParams(searchQuery),
    useRouter: () =>
      ({
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
        push: routerPushMock,
        refresh: vi.fn(),
        replace: vi.fn(),
        bfcacheId: null,
      }) as unknown as ReturnType<typeof import("next/navigation")["useRouter"]>,
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
    routerPushMock.mockReset();

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

  it("preserves insight density scores in the virtualized body", () => {
    const rows = Array.from({ length: GOVERNANCE_FINDINGS_QUEUE_VIRTUALIZE_MIN_ROWS }, (_, index) =>
      sampleRow(index),
    );
    rows[0] = { ...rows[0]!, insightDensityScore: 87 };

    render(
      <GovernanceFindingsQueueDesktopTable
        rows={rows}
        buyerPolishedShell={false}
        showInsightDensityScore
      />,
    );

    expect(screen.getByTestId("governance-row-insight-density-finding-0")).toHaveTextContent("Density 87");
  });

  it("preserves insight density scores in grouped working-mode rows", () => {
    const row = {
      ...rowForResource(0, resourceGroupA),
      insightDensityScore: 87,
    };

    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[row]}
        buyerPolishedShell={false}
        groupByResource
        showInsightDensityScore
      />,
    );

    expect(screen.getByTestId("governance-row-insight-density-finding-0")).toHaveTextContent("Density 87");
  });

  it("does not keyboard-navigate findings when run id is blank", () => {
    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[{ ...sampleRow(0), runId: "   " }]}
        buyerPolishedShell={false}
      />,
    );

    const keyboardRegion = screen.getByTestId("governance-findings-queue-keyboard-region");
    fireEvent.keyDown(keyboardRegion, { key: "Enter" });

    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("renders operational finding title without inspect link when run id is blank", () => {
    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[{ ...sampleRow(0), runId: "   ", title: "PHI minimization risk" }]}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.queryByRole("link", { name: "PHI minimization risk" })).toBeNull();
    expect(screen.getByText("PHI minimization risk")).toBeInTheDocument();
  });

  it("renders assigned-to-me review label without link when run id is blank", () => {
    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[{ ...sampleRow(0), runId: "   ", runLabel: "Review pending" }]}
        buyerPolishedShell={false}
        queueMode="assigned-to-me"
      />,
    );

    expect(screen.queryByRole("link", { name: "Review pending" })).toBeNull();
    expect(screen.getByText("Review pending")).toBeInTheDocument();
    expect(screen.getByText("Review id was not stored.")).toBeInTheDocument();
  });

  it("marks grouped rows opened through the supplied callback", async () => {
    const row = rowForResource(0, resourceGroupA);
    const onRowOpened = vi.fn();

    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[row]}
        buyerPolishedShell={false}
        groupByResource
        onRowOpened={onRowOpened}
      />,
    );

    await screen.getByRole("link", { name: "Risk 0" }).click();

    expect(onRowOpened).toHaveBeenCalledWith(row);
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

  it("explains severity does not apply on decision rows in both shells (P-11)", () => {
    const decisionRow = { ...sampleRow(0), recordKind: "decision" as const };

    const { unmount } = render(
      <GovernanceFindingsQueueDesktopTable rows={[decisionRow]} buyerPolishedShell={true} />,
    );

    expect(screen.getByText("Severity does not apply to recorded decision rows.")).toBeInTheDocument();
    unmount();

    render(<GovernanceFindingsQueueDesktopTable rows={[decisionRow]} buyerPolishedShell={false} />);

    expect(screen.getByText("Severity does not apply to recorded decision rows.")).toBeInTheDocument();
  });

  it("preserves zero age and explains when age was not stored", () => {
    render(
      <GovernanceFindingsQueueDesktopTable
        rows={[{ ...sampleRow(0), agingDays: 0 }, { ...sampleRow(1), agingDays: null }]}
        buyerPolishedShell={false}
      />,
    );

    const table = screen.getByRole("table", { name: "Findings" });
    const rows = within(table).getAllByRole("row");
    const zeroAgeCells = within(rows[1]).getAllByRole("cell");
    const missingAgeCells = within(rows[2]).getAllByRole("cell");

    expect(zeroAgeCells[5]?.textContent).toBe("0d");
    expect(missingAgeCells[5]?.textContent).toBe("Aging days were not stored.");
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
