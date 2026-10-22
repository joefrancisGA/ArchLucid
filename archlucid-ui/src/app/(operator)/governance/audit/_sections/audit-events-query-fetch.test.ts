import { describe, expect, it, vi } from "vitest";

import { searchAuditEvents } from "@/lib/api";

import { fetchAuditEventsSearch } from "./audit-events-query-fetch";

vi.mock("@/lib/api", () => ({
  searchAuditEvents: vi.fn(async () => ({
    items: [],
    hasMore: false,
    nextCursor: null,
  })),
}));

describe("fetchAuditEventsSearch", () => {
  it("includes runId in search payload when review filter is set", async () => {
    const reviewId = "853472cf-81fa-4314-9679-1ab0f9ae6524";

    await fetchAuditEventsSearch({
      eventType: "",
      fromUtc: "",
      toUtc: "",
      correlationId: "",
      actorUserId: "",
      runId: reviewId,
    });

    expect(searchAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: reviewId,
      }),
    );
  });
});
