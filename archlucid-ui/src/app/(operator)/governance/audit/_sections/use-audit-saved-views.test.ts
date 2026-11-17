import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";

import { useAuditSavedViews } from "./use-audit-saved-views";

function view(id: string): OperatorSavedView {
  return {
    id,
    surface: "audit",
    name: id,
    payload: { filters: { actorUserId: id } },
    createdUtc: "2026-11-15T00:00:00Z",
    updatedUtc: "2026-11-15T00:00:00Z",
  };
}

describe("useAuditSavedViews", () => {
  it("ignores a delayed search after another saved view is selected", async () => {
    const older = Promise.withResolvers<CursorPagedResponse<AuditEvent>>();
    const newer = Promise.withResolvers<CursorPagedResponse<AuditEvent>>();
    const executeSearch = vi.fn().mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const applySearchPageToState = vi.fn();
    const setSearching = vi.fn();
    const setValue = vi.fn();
    const { result } = renderHook(() => useAuditSavedViews({
      currentFilters: vi.fn(),
      auditDatePreset: null,
      advancedAuditFiltersOpen: false,
      executeSearch,
      applySearchPageToState,
      applyDemoAuditFallback: vi.fn(),
      setEventType: setValue,
      setFromUtc: setValue,
      setToUtc: setValue,
      setCorrelationId: setValue,
      setActorUserId: setValue,
      setRunId: setValue,
      setAuditDatePreset: setValue,
      setAdvancedAuditFiltersOpen: setValue,
      setSearching,
      setFailure: vi.fn(),
    }));

    let first: Promise<void> | undefined;
    let second: Promise<void> | undefined;
    act(() => {
      first = result.current.loadAuditSavedView(view("first"));
      second = result.current.loadAuditSavedView(view("second"));
    });

    const page = { items: [], hasMore: false, nextCursor: null, requestedTake: 20 };
    await act(async () => {
      older.resolve(page);
      await first;
    });
    expect(applySearchPageToState).not.toHaveBeenCalled();
    expect(setSearching).toHaveBeenLastCalledWith(true);

    await act(async () => {
      newer.resolve(page);
      await second;
    });
    expect(applySearchPageToState).toHaveBeenCalledExactlyOnceWith(
      page, expect.objectContaining({ actorUserId: "second" }),
    );
    expect(setSearching).toHaveBeenLastCalledWith(false);
  });
});
