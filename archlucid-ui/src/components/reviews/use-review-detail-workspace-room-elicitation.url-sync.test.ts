import { renderHook } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewDetailWorkspaceRoomElicitation } from "@/components/reviews/use-review-detail-workspace-room-elicitation";
import { REVIEW_ROOM_ELICITATION_PARAM } from "@/lib/reviews/review-room-elicitation-url";

const roomSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "reviewTab=overview" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyQuery(query: string): void {
      state.query = query;

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "reviewTab=overview";
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-a",
  useSearchParams: () => new URLSearchParams(roomSearchParamsHarness.state.query),
}));

function RoomSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    roomSearchParamsHarness.subscribe,
    () => roomSearchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("useReviewDetailWorkspaceRoomElicitation URL sync", () => {
  beforeEach(() => {
    roomSearchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-a?reviewTab=overview");
  });

  it("follows roomElicitation query changes without a popstate event", () => {
    const { result, rerender } = renderHook(() => useReviewDetailWorkspaceRoomElicitation(), {
      wrapper: RoomSearchParamsRerenderHost,
    });

    expect(result.current.roomElicitationActive).toBe(false);

    roomSearchParamsHarness.applyQuery(`reviewTab=overview&${REVIEW_ROOM_ELICITATION_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-a?reviewTab=overview&${REVIEW_ROOM_ELICITATION_PARAM}=1`,
    );
    rerender();

    expect(result.current.roomElicitationActive).toBe(true);
  });
});
