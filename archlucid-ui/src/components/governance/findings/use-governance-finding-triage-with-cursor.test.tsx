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
});
