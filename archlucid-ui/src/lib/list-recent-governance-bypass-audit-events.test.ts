import { describe, expect, it, vi, beforeEach } from "vitest";

import { listRecentGovernanceBypassAuditEvents } from "./list-recent-governance-bypass-audit-events";

const searchAuditEvents = vi.fn();

vi.mock("@/lib/api", () => ({
  searchAuditEvents: (...args: unknown[]) => searchAuditEvents(...args),
}));

describe("listRecentGovernanceBypassAuditEvents", () => {
  beforeEach(() => {
    searchAuditEvents.mockReset();
  });

  it("queries GovernanceBypassInvoked events for the rolling window", async () => {
    searchAuditEvents.mockResolvedValue({
      items: [{ eventId: "evt-1" }],
      hasMore: false,
      nextCursor: null,
      requestedTake: 25,
    });

    const events = await listRecentGovernanceBypassAuditEvents({ days: 30, take: 25 });

    expect(events).toHaveLength(1);
    expect(searchAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "GovernanceBypassInvoked",
        take: 25,
      }),
    );
  });
});
