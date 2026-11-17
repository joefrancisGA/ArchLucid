import {
  isFirstReviewOpenGateLabel,
  type FirstReviewOpenGateLabel,
} from "@/lib/reviews/first-review-spine-band";

export type ArchLucidOpenGateReturnRecord = {
  readonly runId: string;
  readonly openGateLabel: FirstReviewOpenGateLabel;
  readonly href: string;
  readonly recordedAtUtc: string;
  readonly findingId?: string | null;
};

const STORAGE_PREFIX = "archlucid-open-gate-return:" as const;

function storageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId.trim()}`;
}

export function readArchLucidOpenGateReturnRecord(workspaceId: string): ArchLucidOpenGateReturnRecord | null {
  if (typeof window === "undefined" || workspaceId.trim().length === 0) {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey(workspaceId));

  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isArchLucidOpenGateReturnRecord(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isArchLucidOpenGateReturnRecord(value: unknown): value is ArchLucidOpenGateReturnRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.runId !== "string"
    || !isFirstReviewOpenGateLabel(candidate.openGateLabel)
    || typeof candidate.href !== "string"
    || typeof candidate.recordedAtUtc !== "string"
  ) {
    return false;
  }

  return (
    candidate.findingId === undefined
    || candidate.findingId === null
    || typeof candidate.findingId === "string"
  );
}

export function writeArchLucidOpenGateReturnRecord(
  workspaceId: string,
  record: ArchLucidOpenGateReturnRecord,
): void {
  if (typeof window === "undefined" || workspaceId.trim().length === 0) {
    return;
  }

  window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(record));
}
