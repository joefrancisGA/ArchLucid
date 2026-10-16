import { render, screen, waitFor } from "@testing-library/react";
import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewMeetingPacketButton } from "@/components/reviews/ReviewMeetingPacketButton";
import { REVIEW_MEETING_PACKET_OPEN_PARAM } from "@/lib/reviews/review-meeting-packet-panels-url";

const searchParamsHarness = vi.hoisted(() => {
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
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(searchParamsHarness.state.query),
}));

function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    searchParamsHarness.subscribe,
    () => searchParamsHarness.state.query,
    () => "reviewTab=overview",
  );

  return createElement("div", null, children);
}

describe("ReviewMeetingPacketButton URL sync", () => {
  beforeEach(() => {
    searchParamsHarness.reset();
    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");
  });

  it("follows meetingPacketOpen query changes without a popstate event", async () => {
    const { rerender } = render(
      <SearchParamsRerenderHost>
        <ReviewMeetingPacketButton
          runId="run-abc"
          findingsQueueHref="/architecture/reviews/run-abc/findings"
        />
      </SearchParamsRerenderHost>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    searchParamsHarness.applyQuery(`reviewTab=overview&${REVIEW_MEETING_PACKET_OPEN_PARAM}=1`);
    window.history.replaceState(
      {},
      "",
      `/architecture/reviews/run-abc?reviewTab=overview&${REVIEW_MEETING_PACKET_OPEN_PARAM}=1`,
    );
    rerender(
      <SearchParamsRerenderHost>
        <ReviewMeetingPacketButton
          runId="run-abc"
          findingsQueueHref="/architecture/reviews/run-abc/findings"
        />
      </SearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Prepare for review meeting" })).toBeInTheDocument();
    });
  });
});
