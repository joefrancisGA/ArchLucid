import { describe, expect, it } from "vitest";

import { mapAuditEventToReplayHistoryEntry, mergeReplayValidationHistory } from "@/lib/replay-validation-history";

describe("replay-validation-history", () => {
  it("maps audit replay events into history rows", () => {
    const entry = mapAuditEventToReplayHistoryEntry({
      eventId: "evt-1",
      occurredUtc: "2026-07-11T12:00:00.000Z",
      eventType: "ReplayExecuted",
      actorUserId: "user-1",
      actorUserName: "Alex Operator",
      tenantId: "tenant",
      workspaceId: "workspace",
      projectId: "default",
      runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      manifestId: null,
      artifactId: null,
      dataJson: '{"mode":"RebuildManifest"}',
      correlationId: null,
    });

    expect(entry.mode).toBe("RebuildManifest");
    expect(entry.initiatedBy).toBe("Alex Operator");
    expect(entry.source).toBe("audit");
  });

  it("merges session and audit history without duplicates", () => {
    const merged = mergeReplayValidationHistory(
      [
        {
          id: "session-1",
          runId: "run-1",
          mode: "ReconstructOnly",
          occurredUtc: "2026-07-11T13:00:00.000Z",
          durationMs: 1000,
          outcome: "valid",
          aiUsageLabel: "None",
          initiatedBy: "You",
          source: "session",
        },
      ],
      [
        {
          id: "audit-1",
          runId: "run-1",
          mode: "RebuildManifest",
          occurredUtc: "2026-07-11T12:00:00.000Z",
          durationMs: null,
          outcome: "valid",
          aiUsageLabel: "Limited",
          initiatedBy: "Alex",
          source: "audit",
          auditEventId: "audit-1",
        },
      ],
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]?.id).toBe("session-1");
  });
});
