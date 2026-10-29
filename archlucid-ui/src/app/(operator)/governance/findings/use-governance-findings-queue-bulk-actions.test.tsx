import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchQuery = vi.hoisted(() => ({ value: "bulkFindings=stale-finding" }));
const routerReplaceMock = vi.hoisted(() => vi.fn());
const productLineState = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(searchQuery.value),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineState.value }),
}));

import { useGovernanceFindingsQueueBulkActions } from "@/app/(operator)/governance/findings/use-governance-findings-queue-bulk-actions";

describe("useGovernanceFindingsQueueBulkActions", () => {
  beforeEach(() => {
    searchQuery.value = "bulkFindings=stale-finding";
    productLineState.value = "architecture";
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

  it("hydrates bulkFindings when available ids are trimmed from padded register rows", () => {
    searchQuery.value = "bulkFindings=finding-a";

    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["finding-a"]),
      }),
    );

    expect(result.current.selectedFindingIds).toEqual(new Set(["finding-a"]));
  });

  it("does not write findingId when the architecture product line changes selection", () => {
    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["finding-a"]),
      }),
    );

    result.current.onSelectionChange(new Set(["finding-a"]));

    expect(routerReplaceMock).toHaveBeenCalledWith("/governance/findings?bulkFindings=finding-a", {
      scroll: false,
    });
  });
});

describe("useGovernanceFindingsQueueBulkActions SecureNow path inspect cursor", () => {
  beforeEach(() => {
    productLineState.value = "security";
    searchQuery.value = "architectureId=customer-intake";
    routerReplaceMock.mockReset();
  });

  it("writes findingId when exactly one row is selected", () => {
    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["finding-a"]),
      }),
    );

    result.current.onSelectionChange(new Set(["finding-a"]));

    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/governance/findings?architectureId=customer-intake&bulkFindings=finding-a&findingId=finding-a",
      { scroll: false },
    );
  });

  it("hydrates selection from a padded findingId query value", () => {
    searchQuery.value = "architectureId=customer-intake&findingId=%20finding-a%20";

    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["finding-a"]),
      }),
    );

    expect(result.current.selectedFindingIds).toEqual(new Set(["finding-a"]));
  });

  it("hydrates selection from findingId when bulkFindings is absent", () => {
    searchQuery.value = "architectureId=customer-intake&findingId=finding-a";

    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["finding-a"]),
      }),
    );

    expect(result.current.selectedFindingIds).toEqual(new Set(["finding-a"]));
    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/governance/findings?architectureId=customer-intake&findingId=finding-a&bulkFindings=finding-a",
      { scroll: false },
    );
  });

  it("clears findingId when multiple rows are selected", () => {
    const { result } = renderHook(() =>
      useGovernanceFindingsQueueBulkActions({
        refresh: vi.fn(),
        mode: "tenant",
        availableFindingIds: new Set(["finding-a", "finding-b"]),
      }),
    );

    result.current.onSelectionChange(new Set(["finding-a", "finding-b"]));

    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/governance/findings?architectureId=customer-intake&bulkFindings=finding-a%2Cfinding-b",
      { scroll: false },
    );
  });
});
