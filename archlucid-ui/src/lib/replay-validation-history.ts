import { searchAuditEvents, type AuditEvent } from "@/lib/api/audit-api";
import {
  deriveReplayValidationOutcome,
  formatReplayValidationModeTitle,
  replayValidationModeDefinition,
  REPLAY_VALIDATION_RESULT_NOT_STORED_LABEL,
  type ReplayValidationHistoryEntry,
  type ReplayValidationOutcome,
} from "@/lib/replay-validation-workflow";
import type { ReplayResponse } from "@/types/authority";

function parseAuditReplayMode(dataJson: string): string {
  try {
    const parsed = JSON.parse(dataJson) as { mode?: string };
    return parsed.mode?.trim() ?? "";
  } catch {
    return "";
  }
}

function parseAuditReplayOutcome(dataJson: string): ReplayValidationOutcome | null {
  try {
    const parsed = JSON.parse(dataJson) as { outcome?: string; result?: string };
    const raw = parsed.outcome?.trim() ?? parsed.result?.trim() ?? "";

    if (raw.length === 0) {
      return null;
    }

    switch (raw) {
      case "valid":
      case "valid_with_warnings":
      case "invalid":
      case "incomplete":
      case "failed":
      case "canceled":
        return raw;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function mapAuditEventToReplayHistoryEntry(event: AuditEvent): ReplayValidationHistoryEntry {
  const mode = parseAuditReplayMode(event.dataJson);
  const definition = replayValidationModeDefinition(mode);
  const parsedOutcome = parseAuditReplayOutcome(event.dataJson);
  const actorName = event.actorUserName?.trim() ?? "";
  const actorId = event.actorUserId?.trim() ?? "";
  const initiatedBy =
    actorName.length > 0 ? actorName : actorId.length > 0 ? actorId : "Actor was not stored.";

  return {
    id: event.eventId,
    runId: event.runId ?? "",
    mode,
    occurredUtc: event.occurredUtc,
    durationMs: null,
    outcome: parsedOutcome ?? "valid",
    outcomeLabel: parsedOutcome === null ? REPLAY_VALIDATION_RESULT_NOT_STORED_LABEL : undefined,
    aiUsageLabel: definition.aiUsageLabel,
    initiatedBy,
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
