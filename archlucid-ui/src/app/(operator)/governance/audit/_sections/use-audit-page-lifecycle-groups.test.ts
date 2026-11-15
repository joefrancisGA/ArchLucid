import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AuditEvent } from "@/lib/api";

import { useAuditPageLifecycleGroups } from "./use-audit-page-lifecycle-groups";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 0,
}));

function event(eventId: string, eventType: string, occurredUtc: string): AuditEvent {
  return {
    eventId,
    eventType,
    occurredUtc,
    actorUserId: "user-1",
    actorUserName: "Operator",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    runId: "review-1",
    manifestId: null,
    artifactId: null,
    dataJson: "{}",
    correlationId: null,
  };
}

describe("useAuditPageLifecycleGroups", () => {
  it("keeps story stages ordered while sorting events within each stage by instant", () => {
    const events = [
      event("unreadable", "findings.snapshot.created", "unreadable"),
      event("later", "findings.snapshot.created", "2026-10-15T12:00:00.1Z"),
      event("earlier", "findings.snapshot.created", "2026-10-15T12:00:00Z"),
      event("started", "RunStarted", "2026-10-15T11:50:00Z"),
    ];
    const { result } = renderHook(() => useAuditPageLifecycleGroups({
      buyerPolishedShell: false,
      viewMode: "story",
      events,
      runId: "review-1",
      ctoDemoAuditFilterActive: false,
    }));

    expect(result.current.displayEvents.map(({ eventId }) => eventId))
      .toEqual(["started", "earlier", "later", "unreadable"]);
  });
});
