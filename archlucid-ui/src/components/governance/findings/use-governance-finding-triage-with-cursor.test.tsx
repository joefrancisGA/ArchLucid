import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

const routerReplaceMock = vi.hoisted(() => vi.fn());
const searchQuery = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(searchQuery.value),
}));

import { useGovernanceFindingTriageWithCursor } from "@/components/governance/findings/use-governance-finding-triage-with-cursor";

function findingRow(findingId: string): GovernanceFindingQueueRow {
  return {
    recordKind: "finding",
    findingId,
    runId: "run-1",
    title: "Gap",
    severity: "High",
    agingDays: 1,
    revisitDueUtc: null,
    policyRuleId: null,
    disposition: "open",
    resourceId: null,
    resourceDisplayName: null,
    insightDensityScore: 50,
  } as GovernanceFindingQueueRow;
}

describe("useGovernanceFindingTriageWithCursor", () => {
  beforeEach(() => {
    searchQuery.value = "";
    routerReplaceMock.mockReset();
  });

  it("does not rewrite focusedFinding when the URL already matches a padded active row id", async () => {
    searchQuery.value = "focusedFinding=finding-a";
    const rows = [findingRow("  finding-a  ")];

    renderHook(() => useGovernanceFindingTriageWithCursor(rows, new URLSearchParams(searchQuery.value)));

    await waitFor(() => {
      expect(routerReplaceMock).not.toHaveBeenCalled();
    });
  });

  it("writes trimmed focusedFinding once when triage opens on a padded row", async () => {
    const rows = [findingRow("  finding-a  ")];

    const { result } = renderHook(() =>
      useGovernanceFindingTriageWithCursor(rows, new URLSearchParams(searchQuery.value)),
    );

    act(() => {
      result.current.openForRow(rows[0]!);
    });

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledTimes(1);
    });

    expect(routerReplaceMock).toHaveBeenCalledWith("/governance/findings?focusedFinding=finding-a", {
      scroll: false,
    });
  });

  it("strips a whitespace-only focusedFinding param when triage is closed", async () => {
    searchQuery.value = "focusedFinding=%20%20";

    renderHook(() => useGovernanceFindingTriageWithCursor([], new URLSearchParams(searchQuery.value)));

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledTimes(1);
    });

    expect(routerReplaceMock).toHaveBeenCalledWith("/governance/findings", { scroll: false });
  });

  it("closes triage and strips a whitespace-only focusedFinding param when the URL changes", async () => {
    searchQuery.value = "focusedFinding=finding-a";
    const rows = [findingRow("finding-a")];

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useGovernanceFindingTriageWithCursor(rows, new URLSearchParams(query)),
      { initialProps: { query: searchQuery.value } },
    );

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    routerReplaceMock.mockReset();
    searchQuery.value = "focusedFinding=%20%20";
    rerender({ query: searchQuery.value });

    await waitFor(() => {
      expect(result.current.open).toBe(false);
    });

    expect(routerReplaceMock).toHaveBeenCalledWith("/governance/findings", { scroll: false });
  });

  it("opens triage when focusedFinding changes to another finding without remounting", async () => {
    searchQuery.value = "focusedFinding=finding-a";
    const rows = [findingRow("finding-a"), findingRow("finding-b")];

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useGovernanceFindingTriageWithCursor(rows, new URLSearchParams(query)),
      { initialProps: { query: searchQuery.value } },
    );

    await waitFor(() => {
      expect(result.current.open).toBe(true);
      expect(result.current.activeRow?.findingId).toBe("finding-a");
    });

    searchQuery.value = "focusedFinding=finding-b";
    rerender({ query: searchQuery.value });

    await waitFor(() => {
      expect(result.current.activeRow?.findingId).toBe("finding-b");
    });
  });

  it("opens triage from a focusedFinding deep link after the panel was closed", async () => {
    searchQuery.value = "focusedFinding=finding-a";
    const rows = [findingRow("finding-a"), findingRow("finding-b")];

    const { result, rerender } = renderHook(
      ({ query }: { query: string }) =>
        useGovernanceFindingTriageWithCursor(rows, new URLSearchParams(query)),
      { initialProps: { query: searchQuery.value } },
    );

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    act(() => {
      result.current.close();
    });

    await waitFor(() => {
      expect(result.current.open).toBe(false);
    });

    searchQuery.value = "focusedFinding=finding-b";
    rerender({ query: searchQuery.value });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
      expect(result.current.activeRow?.findingId).toBe("finding-b");
    });
  });

  it("strips unknown focusedFinding after finding rows load", async () => {
    searchQuery.value = "focusedFinding=missing-id";

    const { rerender } = renderHook(
      ({ rows }: { rows: readonly GovernanceFindingQueueRow[] }) =>
        useGovernanceFindingTriageWithCursor(rows, new URLSearchParams(searchQuery.value)),
      { initialProps: { rows: [] as readonly GovernanceFindingQueueRow[] } },
    );

    routerReplaceMock.mockReset();
    rerender({ rows: [findingRow("finding-a")] });

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalledTimes(1);
    });

    expect(routerReplaceMock).toHaveBeenCalledWith("/governance/findings", { scroll: false });
  });

  it("opens triage when focusedFinding rows arrive after an empty displayed queue", async () => {
    searchQuery.value = "focusedFinding=finding-a";
    const rows = [findingRow("finding-a")];

    const { result, rerender } = renderHook(
      ({ queueRows }: { queueRows: readonly GovernanceFindingQueueRow[] }) =>
        useGovernanceFindingTriageWithCursor(queueRows, new URLSearchParams(searchQuery.value)),
      { initialProps: { queueRows: [] as readonly GovernanceFindingQueueRow[] } },
    );

    rerender({ queueRows: rows });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
      expect(result.current.activeRow?.findingId).toBe("finding-a");
    });
  });
});
