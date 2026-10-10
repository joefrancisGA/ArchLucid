import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchQuery = vi.hoisted(() => ({ value: "bulkFindings=stale-finding" }));
const routerReplaceMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(searchQuery.value),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

import { useGovernanceFindingsQueueBulkActions } from "@/app/(operator)/governance/findings/use-governance-findings-queue-bulk-actions";

describe("useGovernanceFindingsQueueBulkActions", () => {
  beforeEach(() => {
    searchQuery.value = "bulkFindings=stale-finding";
    routerReplaceMock.mockReset();
  });

  it("drops URL selections that are absent from the active queue", () => {
    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["active-finding"]),
      }),
    );

    expect(result.current.selectedFindingIds).toEqual(new Set());
  });
});
