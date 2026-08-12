import type { BulkEvidenceFileOutcome } from "@/lib/bulk-evidence-upload-outcome";

export type RunDetailCreateHomeCapturedEvidenceItem = {
  readonly key: string;
  readonly fileName: string;
  readonly ingestedUtc: string;
};

const CAPTURED_EVIDENCE_STORAGE_PREFIX = "archlucid_create_home_captured_evidence_v1_";

function capturedEvidenceStorageKey(runId: string): string {
  return `${CAPTURED_EVIDENCE_STORAGE_PREFIX}${runId.trim()}`;
}

export function readPersistedCapturedEvidenceInventory(
  runId: string,
): readonly RunDetailCreateHomeCapturedEvidenceItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(capturedEvidenceStorageKey(trimmedRunId));

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as RunDetailCreateHomeCapturedEvidenceItem[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        typeof item?.key === "string" &&
        typeof item?.fileName === "string" &&
        typeof item?.ingestedUtc === "string",
    );
  } catch {
    return [];
  }
}

export function writePersistedCapturedEvidenceInventory(
  runId: string,
  items: readonly RunDetailCreateHomeCapturedEvidenceItem[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return;
  }

  try {
    window.sessionStorage.setItem(capturedEvidenceStorageKey(trimmedRunId), JSON.stringify(items));
  } catch {
    // Best-effort session persistence for create-home capture inventory.
  }
}

export function deriveCapturedEvidenceFromArtifacts(
  artifacts: readonly { readonly artifactId: string; readonly name: string; readonly createdUtc: string }[],
): RunDetailCreateHomeCapturedEvidenceItem[] {
  return artifacts
    .map((artifact) => ({
      key: artifact.artifactId,
      fileName: artifact.name,
      ingestedUtc: artifact.createdUtc,
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }));
}

export function mergeCapturedEvidenceUploadOutcomes(
  existing: readonly RunDetailCreateHomeCapturedEvidenceItem[],
  outcomes: readonly BulkEvidenceFileOutcome[],
  ingestedUtc: string,
): RunDetailCreateHomeCapturedEvidenceItem[] {
  const map = new Map(existing.map((item) => [item.fileName.toLowerCase(), item]));

  for (const outcome of outcomes) {
    if (outcome.status !== "uploaded") {
      continue;
    }

    const fileName = outcome.fileName.trim().length > 0 ? outcome.fileName.trim() : "upload";
    const key = `upload:${fileName.toLowerCase()}`;

    map.set(fileName.toLowerCase(), {
      key,
      fileName,
      ingestedUtc,
    });
  }

  return [...map.values()].sort((left, right) =>
    left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }),
  );
}

export function reconcileCapturedEvidenceInventory(
  serverItems: readonly RunDetailCreateHomeCapturedEvidenceItem[],
  sessionItems: readonly RunDetailCreateHomeCapturedEvidenceItem[],
): RunDetailCreateHomeCapturedEvidenceItem[] {
  const map = new Map(serverItems.map((item) => [item.fileName.toLowerCase(), item]));

  for (const item of sessionItems) {
    const lookupKey = item.fileName.toLowerCase();

    if (!map.has(lookupKey)) {
      map.set(lookupKey, item);
    }
  }

  return [...map.values()].sort((left, right) =>
    left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }),
  );
}
