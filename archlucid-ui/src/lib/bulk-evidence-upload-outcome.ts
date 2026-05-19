/** Per-file row after a bulk evidence upload attempt. */
export type BulkEvidenceFileOutcome = {
  fileName: string;
  status: "uploaded" | "failed";
  reason?: string;
};

export type BulkEvidenceUploadSummary = {
  uploadedCount: number;
  failedCount: number;
  outcomes: BulkEvidenceFileOutcome[];
  /** True when some files succeeded and some did not. */
  isPartial: boolean;
  /** Top-level operator message. */
  message: string;
};

export type BulkEvidenceUploadSuccessBody = {
  evidenceItemIds?: string[];
};

/** Parses "N of M files were uploaded" from API failure detail (partial batch exception). */
export function parsePartialUploadCountFromDetail(detail: string | undefined): number | null {
  if (detail === undefined || detail.trim().length === 0) {
    return null;
  }

  const match = detail.match(/(\d+)\s+of\s+(\d+)\s+files were uploaded/i);

  if (match === null) {
    return null;
  }

  const uploaded = Number.parseInt(match[1] ?? "", 10);

  if (!Number.isFinite(uploaded) || uploaded < 0) {
    return null;
  }

  return uploaded;
}

/**
 * Maps client file order to outcomes. The API processes files sequentially; empty files are skipped
 * without incrementing uploaded ids; non-empty files fill uploaded slots in order until failure.
 */
export function mapBulkEvidenceFileOutcomes(
  files: File[],
  uploadedNonEmptyCount: number,
  failedReason: string,
): BulkEvidenceFileOutcome[] {
  let nonEmptyIndex = 0;

  return files.map((file) => {
    const fileName = file.name.trim().length > 0 ? file.name : "upload";

    if (file.size === 0) {
      return {
        fileName,
        status: "failed",
        reason: "Empty file (skipped by server)",
      };
    }

    nonEmptyIndex += 1;

    if (nonEmptyIndex <= uploadedNonEmptyCount) {
      return { fileName, status: "uploaded" };
    }

    return {
      fileName,
      status: "failed",
      reason: failedReason,
    };
  });
}

export function buildBulkEvidenceUploadSummary(
  files: File[],
  uploadedNonEmptyCount: number,
  failedReason: string,
  successMessage: string,
): BulkEvidenceUploadSummary {
  const outcomes = mapBulkEvidenceFileOutcomes(files, uploadedNonEmptyCount, failedReason);
  const uploadedCount = outcomes.filter((o) => o.status === "uploaded").length;
  const failedCount = outcomes.filter((o) => o.status === "failed").length;
  const isPartial = uploadedCount > 0 && failedCount > 0;

  let message = successMessage;

  if (isPartial) {
    message = `${uploadedCount} of ${files.length} file(s) uploaded. ${failedCount} failed — see details below.`;
  }

  return {
    uploadedCount,
    failedCount,
    outcomes,
    isPartial,
    message,
  };
}

export function parseSuccessUploadedCount(bodyText: string): number {
  try {
    const parsed = JSON.parse(bodyText) as BulkEvidenceUploadSuccessBody;
    return Array.isArray(parsed.evidenceItemIds) ? parsed.evidenceItemIds.length : 0;
  } catch {
    return 0;
  }
}
