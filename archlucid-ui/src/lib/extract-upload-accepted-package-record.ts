import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

const STORAGE_KEY_PREFIX = "archlucid-extract-upload-last-accepted";

export type ExtractUploadAcceptedPackageRecord = {
  readonly packageId: string;
  readonly acceptedAtUtc: string;
  readonly actorLabel: string;
  readonly resourceCount: number | null;
  readonly fileLabel?: string;
  readonly associateRunId?: string | null;
};

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

  const raw = window.localStorage.getItem(key);

  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ExtractUploadAcceptedPackageRecord>;
    const packageId = parsed.packageId?.trim() ?? "";
    const acceptedAtUtc = parsed.acceptedAtUtc?.trim() ?? "";
    const actorLabel = parsed.actorLabel?.trim() ?? "";

    if (packageId.length === 0 || acceptedAtUtc.length === 0) {
      return null;
    }

    return {
      packageId,
      acceptedAtUtc,
      actorLabel,
      resourceCount:
        typeof parsed.resourceCount === "number" && Number.isFinite(parsed.resourceCount)
          ? parsed.resourceCount
          : null,
      fileLabel: parsed.fileLabel?.trim() || undefined,
      associateRunId: parsed.associateRunId?.trim() || null,
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

  window.localStorage.setItem(key, JSON.stringify(record));
}

export function truncateExtractUploadPackageId(packageId: string, visiblePrefix = 8): string {
  const trimmed = packageId.trim();

  if (trimmed.length <= visiblePrefix + 3) {
    return trimmed;
  }

  return `${trimmed.slice(0, visiblePrefix)}…${trimmed.slice(-8)}`;
}
