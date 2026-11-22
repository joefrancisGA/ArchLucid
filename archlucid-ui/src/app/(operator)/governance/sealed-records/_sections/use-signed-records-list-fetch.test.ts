import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSignedRecordsListFetch } from "./use-signed-records-list-fetch";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), listRuns: vi.fn() }));
const router = { replace: mocks.replace };
let searchParams = new URLSearchParams();

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
vi.mock("@/lib/api", () => ({ listRunsByProjectPaged: mocks.listRuns }));
vi.mock("@/lib/operator/operator-static-demo", () => ({
  tryStaticDemoRunSummariesPaged: () => null,
}));

const listPath = "/governance/sealed-records";
const options = {
  enrichRows: vi.fn(async () => {}),
  resetRetryState: vi.fn(),
  onPaginationPageChange: vi.fn(),
};

function setLocation(query = "") {
  searchParams = new URLSearchParams(query);
  window.history.replaceState(null, "", query ? `${listPath}?${query}` : listPath);
}

describe("sealed-record pagination", () => {
  beforeEach(() => {
    mocks.listRuns.mockResolvedValue({ items: [], requestedTake: 100, hasMore: true, nextCursor: "page-2" });
  });

  afterEach(() => window.history.replaceState(null, "", "/"));

  it("applies the current request after Strict Mode replays its effects", async () => {
    setLocation();
    const { result } = renderHook(() => useSignedRecordsListFetch(options), { reactStrictMode: true });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ hasMore: true, nextCursor: "page-2" });
  });

  it("returns to page one from a bookmark containing a cursor", async () => {
    setLocation("cursor=page-2");
    const { result, rerender } = renderHook(() => useSignedRecordsListFetch(options));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToPreviousPage());

    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith(listPath, { scroll: false });
    expect(result.current).toMatchObject({ page: 1, cursor: "", cursorHistoryLength: 0 });
    setLocation();
    rerender();
    await waitFor(() => expect(mocks.listRuns).toHaveBeenLastCalledWith(
      expect.any(String), 1, 100, expect.objectContaining({ cursor: "" }),
    ));
  });

  it("keeps the next page selected while the URL update is pending", async () => {
    setLocation();
    const { result, rerender } = renderHook(() => useSignedRecordsListFetch(options));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToNextPage());

    expect(result.current).toMatchObject({ page: 2, cursor: "page-2", cursorHistoryLength: 1 });
    setLocation("cursor=page-2");
    rerender();
    await waitFor(() => expect(mocks.listRuns).toHaveBeenLastCalledWith(
      expect.any(String), 2, 100, expect.objectContaining({ cursor: "page-2" }),
    ));
  });
});
