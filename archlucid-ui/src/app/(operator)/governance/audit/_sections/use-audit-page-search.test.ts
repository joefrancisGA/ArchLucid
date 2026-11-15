import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AuditEvent, CursorPagedResponse } from "@/lib/api";

import { useAuditPageSearch } from "./use-audit-page-search";

const searchParams = new URLSearchParams({ from: "2026-10-01T00:00", to: "2026-10-31T23:59" });
const router = { replace: vi.fn() };

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/audit",
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

vi.mock("./use-audit-page-search-query", async () => {
  const { useState } = await import("react");

  return {
    useAuditPageSearchQuery: () => {
      const [events, setEvents] = useState<AuditEvent[]>([]);
      return {
        events,
        applySearchPageToState: ({ items }: CursorPagedResponse<AuditEvent>) => setEvents(items),
      };
    },
  };
});

describe("useAuditPageSearch", () => {
  it("preserves the operator's date range when results arrive", () => {
    const { result } = renderHook(() =>
      useAuditPageSearch({ eventTypes: [], typesLoadFailure: null }, true),
    );
    const from = result.current.fromUtc;
    const to = result.current.toUtc;
    expect(from).toBe("2026-10-01T00:00");
    expect(to).toBe("2026-10-31T23:59");

    act(() => {
      result.current.applySearchPageToState(
        { items: [{
          eventId: "event-1",
          eventType: "ReviewCommitted",
          occurredUtc: "2026-10-15T12:00:00Z",
          actorUserId: "user-1",
          actorUserName: "Operator",
          tenantId: "tenant-1",
          workspaceId: "workspace-1",
          projectId: "project-1",
          runId: null,
          manifestId: null,
          artifactId: null,
          dataJson: "{}",
          correlationId: null,
        }], nextCursor: null, hasMore: false, requestedTake: 50 },
        result.current.currentFilters(),
      );
    });

    expect(result.current.fromUtc).toBe(from);
    expect(result.current.toUtc).toBe(to);
  });
});
