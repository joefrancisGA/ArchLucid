import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSignedRecordsListFilters } from "./use-signed-records-list-filters";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
const router = { replace: mocks.replace };
let searchParams = new URLSearchParams();

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
vi.mock("@/hooks/use-operator-scope-record", () => ({ useOperatorScopeRecord: () => null }));

function openRecordFilters(query: string) {
  searchParams = new URLSearchParams(query);
  window.history.replaceState(null, "", `/governance/sealed-records?${query}`);
  return renderHook(() => useSignedRecordsListFilters({
    rows: [],
    loading: false,
    hasRows: false,
    lastRefreshedAt: null,
    showEmptyState: true,
  }));
}

describe("sealed record filter pagination", () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it.each([
    "cursor=page-2",
    "cursor=page-2&q=claims&from=2026-03-01",
  ])("keeps the cursor when opening a page with %s", (query) => {
    openRecordFilters(query);

    act(() => vi.advanceTimersByTime(250));

    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("clears the cursor after the search filter changes", () => {
    const { result } = openRecordFilters("cursor=page-2");

    act(() => result.current.setSearchQuery("claims"));
    act(() => vi.advanceTimersByTime(250));

    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(
      "/governance/sealed-records?q=claims",
      { scroll: false },
    );
  });

  it("clears the cursor after a custom date changes", () => {
    const { result } = openRecordFilters("cursor=page-2");

    act(() => result.current.onCustomFromUtcChange("2026-03-01"));
    act(() => vi.advanceTimersByTime(250));

    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(
      "/governance/sealed-records?from=2026-03-01",
      { scroll: false },
    );
  });
});
