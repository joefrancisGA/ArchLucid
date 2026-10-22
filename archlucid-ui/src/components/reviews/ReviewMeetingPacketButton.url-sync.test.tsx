import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const pathnameMock = vi.hoisted(() => ({ value: "/architecture/reviews/run-b" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
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
    pathnameMock.value = "/architecture/reviews/run-b";
    window.history.replaceState(
      {},
      "",
      "/architecture/reviews/run-a?reviewTab=findings&q=stale-payment",
    );
  });

  it("opens meeting packet dialog from useSearchParams when window.location.search lags after soft navigation", async () => {
    searchParamsHarness.state.query = "reviewTab=overview";

    render(
      <SearchParamsRerenderHost>
        <ReviewMeetingPacketButton
          runId="run-b"
          findingsQueueHref="/architecture/reviews/run-b/findings"
        />
      </SearchParamsRerenderHost>,
    );

    fireEvent.click(screen.getByTestId("review-meeting-packet-trigger"));

    await waitFor(() => {
      expect(window.location.pathname + window.location.search).toBe(
        `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_MEETING_PACKET_OPEN_PARAM}=1`,
      );
    });
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
      `/architecture/reviews/run-b?reviewTab=overview&${REVIEW_MEETING_PACKET_OPEN_PARAM}=1`,
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
