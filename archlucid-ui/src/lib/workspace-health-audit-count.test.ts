import { describe, expect, it, vi } from "vitest";

import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";

vi.mock("@/lib/api", () => ({
  searchAuditEvents: vi.fn(),
}));

import { searchAuditEvents } from "@/lib/api";

describe("countAuditEventsInWindow", () => {
  it("returns exact when first page has no more", async () => {
    vi.mocked(searchAuditEvents).mockResolvedValueOnce({
      items: [{ eventId: "1" } as never, { eventId: "2" } as never],
      nextCursor: null,
      hasMore: false,
      requestedTake: 500,
    });

    const r = await countAuditEventsInWindow({
      eventType: "GovernancePreCommitBlocked",
      fromUtcIso: "2026-04-01T00:00:00.000Z",
      toUtcIso: "2026-05-01T00:00:00.000Z",
    });

    expect(r.count).toBe(2);
    expect(r.exact).toBe(true);
  });

  it("returns a partial count when more rows are reported without a cursor", async () => {
    vi.mocked(searchAuditEvents).mockResolvedValueOnce({
      items: [{ eventId: "1" } as never],
      nextCursor: null,
      hasMore: true,
      requestedTake: 500,
    });

    const result = await countAuditEventsInWindow({
      eventType: "GovernancePreCommitBlocked",
      fromUtcIso: "2026-04-01T00:00:00.000Z",
      toUtcIso: "2026-05-01T00:00:00.000Z",
    });

    expect(result).toEqual({ count: 1, exact: false });
    expect(searchAuditEvents).toHaveBeenCalledTimes(1);
  });

  it("stops at a repeated cursor without counting that page again", async () => {
    const page = {
      items: [{ eventId: "1" } as never],
      nextCursor: "repeated",
      hasMore: true,
      requestedTake: 500,
    };
    vi.mocked(searchAuditEvents).mockResolvedValue(page);

    const result = await countAuditEventsInWindow({
      eventType: "GovernancePreCommitBlocked",
      fromUtcIso: "2026-04-01T00:00:00.000Z",
      toUtcIso: "2026-05-01T00:00:00.000Z",
    });

    expect(result).toEqual({ count: 1, exact: false });
    expect(searchAuditEvents).toHaveBeenCalledTimes(2);
  });

  it("pages and marks inexact when cap hit", async () => {
    let page = 0;
    vi.mocked(searchAuditEvents).mockImplementation(async () => ({
      items: new Array(500).fill({ eventId: "x" }) as never[],
      nextCursor: `page-${++page}`,
      hasMore: true,
      requestedTake: 500,
    }));

    const r = await countAuditEventsInWindow({
      eventType: "GovernancePreCommitBlocked",
      fromUtcIso: "2026-04-01T00:00:00.000Z",
      toUtcIso: "2026-05-01T00:00:00.000Z",
    });

    expect(r.exact).toBe(false);
    expect(r.count).toBe(500 * 50);
  });
});
