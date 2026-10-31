import type { BulkEvidenceFileOutcome } from "@/lib/bulk-evidence-upload-outcome";

export const RUN_DETAIL_CAPTURED_EVIDENCE_UPLOADED_TIME_NOT_STORED_COPY =
  "Uploaded time was not stored." as const;

export const RUN_DETAIL_CAPTURED_EVIDENCE_UPLOADED_TIME_STORED_EMPTY_COPY =
  "Uploaded time was stored empty." as const;

export const RUN_DETAIL_CAPTURED_EVIDENCE_EVIDENCE_ITEM_ID_STORED_EMPTY_COPY =
  "Evidence item id was stored empty." as const;

export const RUN_DETAIL_CAPTURED_EVIDENCE_FILE_NAME_NOT_STORED_COPY =
  "File name was not stored." as const;

export const RUN_DETAIL_CAPTURED_EVIDENCE_CONTENT_TYPE_NOT_ON_ROW_YET_COPY =
  "Content type is not on this row yet." as const;

export type RunDetailCreateHomeCapturedEvidenceItem = {
  readonly key: string;
  readonly fileName: string;
  readonly ingestedUtc: string | null;
  readonly evidenceItemId?: string | null;
  readonly contentType?: string | null;
  readonly contentTypeCatalogPending?: boolean;
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

    return parsed.filter((item) => {
      if (typeof item?.key !== "string" || item.key.trim().length === 0) {
        return false;
      }

      if (typeof item?.fileName !== "string") {
        return false;
      }

      if (item.ingestedUtc === null || item.ingestedUtc === undefined) {
        return true;
      }

      if (typeof item.ingestedUtc !== "string") {
        return false;
      }

      if (item.ingestedUtc.length === 0) {
        return true;
      }

      return !Number.isNaN(Date.parse(item.ingestedUtc));
    });
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

function resolveCapturedEvidenceFileName(name: string): string {
  if (name.trim().length === 0) {
    return RUN_DETAIL_CAPTURED_EVIDENCE_FILE_NAME_NOT_STORED_COPY;
  }

  return name;
}

export function deriveCapturedEvidenceFromArtifacts(
  artifacts: readonly { readonly artifactId: string; readonly name: string; readonly createdUtc: string }[],
): RunDetailCreateHomeCapturedEvidenceItem[] {
  return artifacts
    .map((artifact) => ({
      key: artifact.artifactId,
      fileName: resolveCapturedEvidenceFileName(artifact.name),
      ingestedUtc: artifact.createdUtc,
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }));
}

export function deriveCapturedEvidenceFromCatalog(
  catalog: readonly {
    readonly evidenceItemId: string;
    readonly originalFileName: string;
    readonly createdUtc?: string;
    readonly contentType?: string;
  }[],
): RunDetailCreateHomeCapturedEvidenceItem[] {
  return catalog
    .map((entry) => ({
      key: entry.evidenceItemId,
      fileName: resolveCapturedEvidenceFileName(entry.originalFileName),
      ingestedUtc: entry.createdUtc ?? null,
      evidenceItemId: entry.evidenceItemId,
      contentType: entry.contentType ?? null,
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }));
}

export function mergeCapturedEvidenceUploadOutcomes(
  existing: readonly RunDetailCreateHomeCapturedEvidenceItem[],
  outcomes: readonly BulkEvidenceFileOutcome[],
  ingestedUtc: string | null,
  evidenceItemIds: readonly string[] = [],
): RunDetailCreateHomeCapturedEvidenceItem[] {
  const map = new Map(existing.map((item) => [item.fileName.toLowerCase(), item]));
  let evidenceIdIndex = 0;

  for (const outcome of outcomes) {
    if (outcome.status !== "uploaded") {
      continue;
    }

    const fileName = resolveCapturedEvidenceFileName(outcome.fileName ?? "");
    const evidenceItemId = evidenceItemIds[evidenceIdIndex] ?? null;

    evidenceIdIndex += 1;

    const mapKey = fileName.trim().length > 0 ? fileName.toLowerCase() : `upload:${evidenceIdIndex}`;

    map.set(mapKey, {
      key: evidenceItemId ?? `upload:${mapKey}`,
      fileName,
      ingestedUtc,
      evidenceItemId,
      contentTypeCatalogPending: true,
    });
  }

  return [...map.values()].sort((left, right) =>
    left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }),
  );
}

export function reconcileCapturedEvidenceInventory(
  serverItems: readonly RunDetailCreateHomeCapturedEvidenceItem[],
  sessionItems: readonly RunDetailCreateHomeCapturedEvidenceItem[],
  options?: { readonly catalogAuthoritative?: boolean },
): RunDetailCreateHomeCapturedEvidenceItem[] {
  const catalogAuthoritative = options?.catalogAuthoritative ?? false;

  if (catalogAuthoritative && serverItems.length > 0) {
    const map = new Map(serverItems.map((item) => [item.fileName.toLowerCase(), item]));

    for (const item of sessionItems) {
      if ((item.evidenceItemId ?? "").length === 0) {
        continue;
      }

      const lookupKey = item.fileName.toLowerCase();
      const existing = map.get(lookupKey);

      if (existing === undefined) {
        map.set(lookupKey, item);
        continue;
      }

      if ((existing.evidenceItemId ?? "").length === 0 && (item.evidenceItemId ?? "").length > 0) {
        map.set(lookupKey, item);
      }
    }

    return [...map.values()].sort((left, right) =>
      left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }),
    );
  }

  const map = new Map(serverItems.map((item) => [item.fileName.toLowerCase(), item]));

  for (const item of sessionItems) {
    const lookupKey = item.fileName.toLowerCase();
    const existing = map.get(lookupKey);

    if (existing === undefined) {
      map.set(lookupKey, item);
      continue;
    }

    if ((existing.evidenceItemId ?? "").length === 0 && (item.evidenceItemId ?? "").length > 0) {
      map.set(lookupKey, item);
    }
  }

  return [...map.values()].sort((left, right) =>
    left.fileName.localeCompare(right.fileName, undefined, { sensitivity: "base" }),
  );
}
