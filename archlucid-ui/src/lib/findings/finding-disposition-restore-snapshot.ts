import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  FINDING_DISPOSITION_REVISIT_WINDOW_HOURS,
  isFindingDispositionRevisitWindowOpen,
} from "@/lib/findings/finding-disposition-revisit-window";

export type FindingDispositionRestoreSnapshot = {
  readonly findingId: string;
  readonly previousDisposition: FindingDispositionKind | null;
  readonly appliedDisposition: FindingDispositionKind;
  readonly appliedAtUtc: string;
  readonly revisitDueUtc: string;
};

const STORAGE_KEY_PREFIX = "archlucid.finding-disposition-restore.v1.";

function storageKey(findingId: string): string {
  return `${STORAGE_KEY_PREFIX}${findingId}`;
}

export function recordFindingDispositionRestoreSnapshot(snapshot: FindingDispositionRestoreSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey(snapshot.findingId), JSON.stringify(snapshot));
  }
  catch {
    /* ignore */
  }
}

export function readFindingDispositionRestoreSnapshot(
  findingId: string,
): FindingDispositionRestoreSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(findingId));

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as FindingDispositionRestoreSnapshot;

    if (parsed.findingId !== findingId) {
      return null;
    }

    if (!isFindingDispositionRevisitWindowOpen(parsed.revisitDueUtc)) {
      window.localStorage.removeItem(storageKey(findingId));

      return null;
    }

    return parsed;
  }
  catch {
    return null;
  }
}

export function clearFindingDispositionRestoreSnapshot(findingId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey(findingId));
}

export function buildDispositionRestoreRevisitDueUtc(now: Date = new Date()): string {
  const revisitDue = new Date(now.getTime() + FINDING_DISPOSITION_REVISIT_WINDOW_HOURS * 60 * 60 * 1000);

  return revisitDue.toISOString();
}
