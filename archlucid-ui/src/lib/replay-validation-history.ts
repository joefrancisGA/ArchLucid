import { searchAuditEvents, type AuditEvent } from "@/lib/api/audit-api";
import {
  deriveReplayValidationOutcome,
  replayValidationModeDefinition,
  type ReplayValidationHistoryEntry,
  type ReplayValidationOutcome,
} from "@/lib/replay-validation-workflow";
import type { ReplayResponse } from "@/types/authority";

function parseAuditReplayMode(dataJson: string): string {
  try {
    const parsed = JSON.parse(dataJson) as { mode?: string };
    const mode = parsed.mode?.trim() ?? "";

    if (mode.length > 0) {
      return mode;
    }
  } catch {
    return "ReconstructOnly";
  }

  return "ReconstructOnly";
}

export function mapAuditEventToReplayHistoryEntry(event: AuditEvent): ReplayValidationHistoryEntry {
  const mode = parseAuditReplayMode(event.dataJson);
  const definition = replayValidationModeDefinition(mode);

  return {
    id: event.eventId,
    runId: event.runId ?? "",
    mode,
    occurredUtc: event.occurredUtc,
    durationMs: null,
    outcome: "valid",
    aiUsageLabel: definition.aiUsageLabel,
    initiatedBy: event.actorUserName?.trim() || event.actorUserId || "Unknown",
    source: "audit",
    auditEventId: event.eventId,
    response: null,
  };
}

export function mapSessionReplayHistoryEntry(params: {
  readonly response: ReplayResponse;
  readonly durationMs: number;
  readonly initiatedBy: string;
  readonly failure?: boolean;
}): ReplayValidationHistoryEntry {
  const definition = replayValidationModeDefinition(params.response.mode);
  const outcome = params.failure
    ? "failed"
    : deriveReplayValidationOutcome({ response: params.response, failure: null }) ?? "valid";

  return {
    id: `${params.response.runId}-${params.response.replayedUtc}`,
    runId: params.response.runId,
    mode: params.response.mode,
    occurredUtc: params.response.replayedUtc,
    durationMs: params.durationMs,
    outcome,
    aiUsageLabel: definition.aiUsageLabel,
    initiatedBy: params.initiatedBy,
    source: "session",
    response: params.response,
  };
}

export async function loadReplayValidationAuditHistory(runId: string): Promise<ReplayValidationHistoryEntry[]> {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const page = await searchAuditEvents({
    runId: trimmed,
    eventType: "ReplayExecuted",
    take: 10,
  });

  return (page.items ?? []).map(mapAuditEventToReplayHistoryEntry);
}

export function mergeReplayValidationHistory(
  sessionEntries: readonly ReplayValidationHistoryEntry[],
  auditEntries: readonly ReplayValidationHistoryEntry[],
): ReplayValidationHistoryEntry[] {
  const merged = [...sessionEntries, ...auditEntries];
  const seen = new Set<string>();

  return merged
    .filter((entry) => {
      const key = `${entry.source}:${entry.id}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((left, right) => right.occurredUtc.localeCompare(left.occurredUtc));
}

export function latestValidationOutcomeByRunId(
  entries: readonly ReplayValidationHistoryEntry[],
): Record<string, ReplayValidationOutcome> {
  const map: Record<string, ReplayValidationOutcome> = {};

  for (const entry of entries) {
    if (map[entry.runId] === undefined) {
      map[entry.runId] = entry.outcome;
    }
  }

  return map;
}
