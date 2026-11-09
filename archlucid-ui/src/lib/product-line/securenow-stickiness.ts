import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import type { RemediationInstanceStatus } from "@/lib/infra-evidence/infra-evidence-remediation-types";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import type { SecureNowCapturePathDelta } from "@/lib/product-line/securenow-capture-path-delta";
import { SECURENOW_PILOT_DISPOSITION_STORAGE_PREFIX } from "@/lib/product-line/securenow-pilot-disposition-storage";

export const SECURENOW_RETURN_HOME_EMPTY =
  "Nothing unfinished on this workspace. This is not a usage score." as const;

export const SECURENOW_STICKINESS_NOT_USAGE_CLAIM = "This is not a usage claim." as const;

const LAST_OPENED_SNAPSHOT_PREFIX = "securenow-last-opened-snapshot:" as const;
const PINNED_PATH_PREFIX = "securenow-pinned-path:" as const;

const AWAITING_VERIFICATION_STATUSES = new Set<RemediationInstanceStatus>([
  "Classified",
  "PreflightPassed",
  "PreflightBlocked",
  "Approved",
  "WaveAssigned",
  "Executed",
  "ChangeImplemented",
]);

export type SecureNowPinnedPathStatus = "added" | "gone" | "unchanged" | "not-in-latest";

export type SecureNowReturnHomeInput = {
  readonly awaitingVerificationCount: number;
  readonly addedCount: number;
  readonly goneCount: number;
  readonly latestSnapshotId: string | null;
  readonly lastOpenedSnapshotId: string | null;
  readonly pinnedPathId: string | null;
  readonly pinnedPathStatus: SecureNowPinnedPathStatus | null;
  readonly extendDispositionCount: number;
};

export function secureNowPathInspectHref(pathId: string): string {
  return `${SECURENOW_REMEDIATION_FACTORY_PATH}?pathId=${encodeURIComponent(pathId.trim())}`;
}

export function formatSecureNowCapturePathDeltaCounts(delta: SecureNowCapturePathDelta): string {
  return `${delta.added.length} added, ${delta.gone.length} gone, ${delta.unchanged.length} unchanged`;
}

export function countRemediationInstancesAwaitingVerification(
  instances: readonly { readonly status: RemediationInstanceStatus; readonly verificationSnapshotId: string | null }[],
): number {
  return instances.filter(
    (instance) =>
      instance.verificationSnapshotId === null && AWAITING_VERIFICATION_STATUSES.has(instance.status),
  ).length;
}

export function resolveSecureNowPinnedPathStatus(
  pathId: string,
  latestPathIds: readonly string[],
  previousPathIds: readonly string[],
): SecureNowPinnedPathStatus {
  const trimmed = pathId.trim();
  const latest = new Set(latestPathIds);
  const previous = new Set(previousPathIds);

  if (latest.has(trimmed) && previous.has(trimmed)) {
    return "unchanged";
  }

  if (latest.has(trimmed)) {
    return "added";
  }

  if (previous.has(trimmed)) {
    return "gone";
  }

  return "not-in-latest";
}

export type SecureNowStickinessScope = {
  readonly tenantId: string;
  readonly workspaceId: string;
};

function storageKey(prefix: string, scope: SecureNowStickinessScope): string {
  return `${prefix}${scope.tenantId.trim()}:${scope.workspaceId.trim()}`;
}

function legacyStorageKey(prefix: string, workspaceId: string): string {
  return `${prefix}${workspaceId.trim()}`;
}

function readScopedValue(prefix: string, scope: SecureNowStickinessScope): string | null {
  if (typeof window === "undefined" || scope.workspaceId.trim().length === 0) {
    return null;
  }

  const scoped = window.localStorage.getItem(storageKey(prefix, scope))?.trim() ?? "";

  if (scoped.length > 0) {
    return scoped;
  }

  const legacy = window.localStorage.getItem(legacyStorageKey(prefix, scope.workspaceId))?.trim() ?? "";

  return legacy.length === 0 ? null : legacy;
}

function writeScopedValue(prefix: string, scope: SecureNowStickinessScope, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (scope.workspaceId.trim().length === 0 || value.trim().length === 0) {
    return;
  }

  window.localStorage.setItem(storageKey(prefix, scope), value.trim());
  window.localStorage.removeItem(legacyStorageKey(prefix, scope.workspaceId));
}

export function readSecureNowLastOpenedSnapshotId(scope: SecureNowStickinessScope): string | null {
  return readScopedValue(LAST_OPENED_SNAPSHOT_PREFIX, scope);
}

export function writeSecureNowLastOpenedSnapshotId(scope: SecureNowStickinessScope, snapshotId: string): void {
  writeScopedValue(LAST_OPENED_SNAPSHOT_PREFIX, scope, snapshotId);
}

export function readSecureNowPinnedPathId(scope: SecureNowStickinessScope): string | null {
  return readScopedValue(PINNED_PATH_PREFIX, scope);
}

export function writeSecureNowPinnedPathId(scope: SecureNowStickinessScope, pathId: string): void {
  writeScopedValue(PINNED_PATH_PREFIX, scope, pathId);
}

export function clearSecureNowPinnedPathId(scope: SecureNowStickinessScope): void {
  if (typeof window === "undefined" || scope.workspaceId.trim().length === 0) {
    return;
  }

  window.localStorage.removeItem(storageKey(PINNED_PATH_PREFIX, scope));
  window.localStorage.removeItem(legacyStorageKey(PINNED_PATH_PREFIX, scope.workspaceId));
}

export function countSecureNowExtendDispositionsInBrowserCache(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  let count = 0;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key === null || !key.startsWith(SECURENOW_PILOT_DISPOSITION_STORAGE_PREFIX)) {
      continue;
    }

    const raw = window.localStorage.getItem(key);

    if (raw === null) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as { outcome?: string };

      if (parsed.outcome?.trim() === "Extend") {
        count += 1;
      }
    } catch {
      continue;
    }
  }

  return count;
}

export function buildSecureNowReturnHomeRows(
  input: SecureNowReturnHomeInput,
): readonly SecureNowHomeDestinationRow[] {
  const rows: SecureNowHomeDestinationRow[] = [];

  if (input.awaitingVerificationCount > 0) {
    rows.push({
      href: "/security/remediation-instances",
      label: "Awaiting verification",
      summary: `${input.awaitingVerificationCount} remediation instance${input.awaitingVerificationCount === 1 ? "" : "s"} still lack a later verification capture.`,
    });
  }

  if (input.addedCount > 0 || input.goneCount > 0) {
    rows.push({
      href: "/infrastructure/snapshots-drift",
      label: "Recent changes",
      summary: `${input.addedCount} path id${input.addedCount === 1 ? "" : "s"} added and ${input.goneCount} gone since the previous successful capture.`,
    });
  }

  if (
    input.lastOpenedSnapshotId !== null
    && input.latestSnapshotId !== null
    && input.lastOpenedSnapshotId !== input.latestSnapshotId
  ) {
    rows.push({
      href: "/infrastructure/snapshots-drift",
      label: "New capture since you last opened Home",
      summary: "A newer successful capture is on this workspace. This is not a usage score.",
    });
  }

  if (input.pinnedPathId !== null && input.pinnedPathStatus !== null) {
    rows.push({
      href: secureNowPathInspectHref(input.pinnedPathId),
      label: "Watched path",
      summary: pinnedPathSummary(input.pinnedPathId, input.pinnedPathStatus),
    });
  }

  if (input.extendDispositionCount > 0) {
    rows.push({
      href: "/administration/securenow-pilot-decision",
      label: "Sponsor follow-up",
      summary: `${input.extendDispositionCount} Extend disposition${input.extendDispositionCount === 1 ? "" : "s"} in this browser cache. Confirm the follow-up on the pilot decision page.`,
    });
  }

  return rows;
}

function pinnedPathSummary(pathId: string, status: SecureNowPinnedPathStatus): string {
  if (status === "unchanged") {
    return `${pathId} is still on the latest capture.`;
  }

  if (status === "added") {
    return `${pathId} appeared on the latest capture.`;
  }

  if (status === "gone") {
    return `${pathId} is gone from the latest capture.`;
  }

  return `${pathId} is not on the latest capture.`;
}
