import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

const STORAGE_KEY_PREFIX = "archlucid-extract-upload-last-accepted";

export type ExtractUploadAcceptedPackageRecord = {
  readonly packageId: string;
  readonly acceptedAtUtc: string;
  readonly actorLabel: string | null;
  readonly resourceCount: number | null;
  readonly fileLabel?: string | null;
  readonly associateRunId?: string | null;
};

export const EXTRACT_UPLOAD_FILE_NAME_NOT_STORED = "File name was not stored." as const;

export const EXTRACT_UPLOAD_FILE_NAME_STORED_EMPTY = "File name was stored empty." as const;

export const EXTRACT_UPLOAD_LINKED_REVIEW_NOT_STORED = "Linked review was not stored." as const;

export const EXTRACT_UPLOAD_LINKED_REVIEW_STORED_EMPTY = "Linked review was stored empty." as const;

export const EXTRACT_UPLOAD_ACTOR_NOT_STORED = "Actor was not stored." as const;

export const EXTRACT_UPLOAD_ACTOR_STORED_EMPTY = "Actor was stored empty." as const;

export const EXTRACT_UPLOAD_PACKAGE_ID_NOT_STORED = "Upload id was not stored." as const;

export const EXTRACT_UPLOAD_PACKAGE_ID_STORED_EMPTY = "Upload id was stored empty." as const;

export function formatExtractUploadAcceptedPackageId(packageId: string): string {
  if (packageId.length === 0) {
    return EXTRACT_UPLOAD_PACKAGE_ID_NOT_STORED;
  }

  if (packageId.trim().length === 0) {
    return EXTRACT_UPLOAD_PACKAGE_ID_STORED_EMPTY;
  }

  return packageId;
}

export function extractUploadPackageIdIsCopyable(packageId: string): boolean {
  return packageId.trim().length > 0;
}

export function formatExtractUploadAcceptedActorLabel(actorLabel: string | null | undefined): string {
  if (actorLabel === null || actorLabel === undefined) {
    return EXTRACT_UPLOAD_ACTOR_NOT_STORED;
  }
  if (actorLabel.trim().length === 0) {
    return EXTRACT_UPLOAD_ACTOR_STORED_EMPTY;
  }

  if (isUuidLike(actorLabel.trim())) {
    return "Actor name was not stored.";
  }

  return actorLabel;
}

export function formatExtractUploadAcceptedFileLabel(fileLabel: string | null | undefined): string {
  if (fileLabel === null || fileLabel === undefined) {
    return EXTRACT_UPLOAD_FILE_NAME_NOT_STORED;
  }

  if (fileLabel.trim().length === 0) {
    return EXTRACT_UPLOAD_FILE_NAME_STORED_EMPTY;
  }

  return fileLabel;
}

export function formatExtractUploadAcceptedLinkedReview(associateRunId: string | null | undefined): string {
  if (associateRunId === null || associateRunId === undefined) {
    return EXTRACT_UPLOAD_LINKED_REVIEW_NOT_STORED;
  }

  if (associateRunId.trim().length === 0) {
    return EXTRACT_UPLOAD_LINKED_REVIEW_STORED_EMPTY;
  }

  return `Review title was not stored. Review id ${associateRunId.trim()}.`;
}

function resolveStorageKey(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const tenantId = scope.tenantId?.trim() ?? "";
  const workspaceId = scope.workspaceId?.trim() ?? "";

  if (tenantId.length === 0 || workspaceId.length === 0) {
    return null;
  }

  return `${STORAGE_KEY_PREFIX}:${tenantId}:${workspaceId}`;
}

export function readExtractUploadAcceptedPackageRecord(): ExtractUploadAcceptedPackageRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = resolveStorageKey();

  if (key === null) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ExtractUploadAcceptedPackageRecord>;
    const packageId = parsed.packageId?.trim() ?? "";
    const acceptedAtUtc = parsed.acceptedAtUtc?.trim() ?? "";
    const actorLabel =
      parsed.actorLabel === undefined || parsed.actorLabel === null
        ? null
        : typeof parsed.actorLabel === "string"
          ? parsed.actorLabel.trim()
          : null;

    if (packageId.length === 0 || acceptedAtUtc.length === 0) {
      return null;
    }

    const fileLabel =
      parsed.fileLabel === undefined || parsed.fileLabel === null
        ? null
        : typeof parsed.fileLabel === "string"
          ? parsed.fileLabel.trim()
          : null;

    return {
      packageId,
      acceptedAtUtc,
      actorLabel,
      resourceCount:
        typeof parsed.resourceCount === "number" && Number.isFinite(parsed.resourceCount)
          ? parsed.resourceCount
          : null,
      fileLabel,
      associateRunId: typeof parsed.associateRunId === "string" ? parsed.associateRunId : null,
    };
  } catch {
    return null;
  }
}

export function writeExtractUploadAcceptedPackageRecord(
  record: ExtractUploadAcceptedPackageRecord,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = resolveStorageKey();

  if (key === null) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch (error) {
    if (error instanceof DOMException) {
      // Private/restricted storage and quota failures are non-fatal.
      return;
    }

    throw error;
  }
}

export function truncateExtractUploadPackageId(packageId: string, visiblePrefix = 8): string {
  const trimmed = packageId.trim();

  if (trimmed.length <= visiblePrefix + 3) {
    return trimmed;
  }

  return `${trimmed.slice(0, visiblePrefix)}…${trimmed.slice(-8)}`;
}
