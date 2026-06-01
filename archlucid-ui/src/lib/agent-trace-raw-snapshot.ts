import type { AgentExecutionTraceRow, AgentTraceRawSnapshot } from "@/types/agent-forensics";

/** Maps persisted trace rows by traceId for TB-110 inline raw expansion. */
export function buildAgentTraceRawSnapshotByTraceId(
  traces: readonly AgentExecutionTraceRow[],
): Readonly<Record<string, AgentTraceRawSnapshot>> {
  const map: Record<string, AgentTraceRawSnapshot> = {};

  for (const trace of traces) {
    map[trace.traceId] = {
      userPrompt: trace.userPrompt ?? null,
      rawResponse: trace.rawResponse ?? null,
      systemPrompt: trace.systemPrompt ?? null,
      parsedResultJson: trace.parsedResultJson ?? null,
    };
  }

  return map;
}
