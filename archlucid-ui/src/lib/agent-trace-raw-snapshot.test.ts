import { describe, expect, it } from "vitest";

import { buildAgentTraceRawSnapshotByTraceId } from "@/lib/agent-trace-raw-snapshot";

describe("buildAgentTraceRawSnapshotByTraceId", () => {
  it("maps traceId to redacted inline fields", () => {
    const map = buildAgentTraceRawSnapshotByTraceId([
      {
        traceId: "t1",
        runId: "r1",
        taskId: "task-1",
        agentType: 1,
        parseSucceeded: true,
        createdUtc: "2026-05-01T12:00:00Z",
        userPrompt: "hello",
        rawResponse: "{}",
      },
    ]);

    expect(map.t1).toEqual({
      userPrompt: "hello",
      rawResponse: "{}",
      systemPrompt: null,
      parsedResultJson: null,
    });
  });
});
