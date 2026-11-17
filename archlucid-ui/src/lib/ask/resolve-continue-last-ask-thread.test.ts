import { describe, expect, it } from "vitest";

import { resolveContinueLastAskThread } from "@/lib/ask/resolve-continue-last-ask-thread";
import type { ConversationThread } from "@/types/conversation";

function thread(overrides: Partial<ConversationThread> = {}): ConversationThread {
  return {
    threadId: "thread-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    runId: "run-1",
    title: "Network review Q&A",
    lastUpdatedUtc: "2026-01-01T00:00:00Z",
    createdUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveContinueLastAskThread", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastAskThread(null)).toBeNull();
    expect(resolveContinueLastAskThread({})).toBeNull();
    expect(resolveContinueLastAskThread("nope")).toBeNull();
    expect(resolveContinueLastAskThread([])).toBeNull();
  });

  it("prefers the most recently updated thread when no stored thread exists", () => {
    const match = resolveContinueLastAskThread([
      thread({ threadId: "thread-old", lastUpdatedUtc: "2025-01-01T00:00:00Z" }),
      thread({ threadId: "thread-new", lastUpdatedUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(match?.threadId).toBe("thread-new");
  });

  it.each([
    { older: "2026-02-01T08:00:00Z", newer: "2026-02-01T08:00:00.500Z" },
    { older: "2026-02-01T09:00:00+02:00", newer: "2026-02-01T08:00:00" },
  ])("resumes the latest instant when timestamp formats differ", ({ older, newer }) => {
    const match = resolveContinueLastAskThread([
      thread({ threadId: "thread-new", lastUpdatedUtc: newer }),
      thread({ threadId: "thread-old", lastUpdatedUtc: older }),
    ]);

    expect(match?.threadId).toBe("thread-new");
  });

  it("skips unparseable timestamps in the recency fallback", () => {
    const match = resolveContinueLastAskThread([
      thread({ threadId: "thread-invalid", lastUpdatedUtc: "unknown" }),
      thread({ threadId: "thread-valid", lastUpdatedUtc: "2026-02-01T08:00:00Z" }),
    ]);

    expect(match?.threadId).toBe("thread-valid");
  });
});
