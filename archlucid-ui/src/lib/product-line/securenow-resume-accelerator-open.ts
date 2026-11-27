
import type { SecureNowStickinessScope } from "@/lib/product-line/securenow-stickiness";

const RESUME_PREFIX = "securenow-resume-accelerator:" as const;
const RECENT_PREFIX = "securenow-recent-accelerator:" as const;
const VISITED_PREFIX = "securenow-accelerator-visited:" as const;

export type SecureNowAcceleratorOpenRecord = {
  readonly href: string;
  readonly label: string;
  readonly openedAtUtc: string;
};

function storageKey(prefix: string, scope: SecureNowStickinessScope): string {
  return `${prefix}${scope.tenantId.trim()}:${scope.workspaceId.trim()}`;
}

function safeParseRecent(raw: string | null): SecureNowAcceleratorOpenRecord[] {
  if (raw === null || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as SecureNowAcceleratorOpenRecord[];
    return Array.isArray(parsed) ? parsed.filter((row) => row.href?.trim().length > 0) : [];
  } catch {
    return [];
  }
}

export function recordSecureNowAcceleratorOpen(
  scope: SecureNowStickinessScope,
  input: { readonly href: string; readonly label: string },
): void {
  if (typeof window === "undefined" || scope.workspaceId.trim().length === 0) return;
  const href = input.href.trim();
  const label = input.label.trim();
  if (href.length === 0 || label.length === 0) return;

  const record: SecureNowAcceleratorOpenRecord = {
    href,
    label,
    openedAtUtc: new Date().toISOString(),
  };

  try {
    const storage = window.localStorage;
    storage.setItem(storageKey(RESUME_PREFIX, scope), JSON.stringify(record));

    const recent = safeParseRecent(storage.getItem(storageKey(RECENT_PREFIX, scope)))
      .filter((row) => row.href !== href);
    recent.unshift(record);
    storage.setItem(storageKey(RECENT_PREFIX, scope), JSON.stringify(recent.slice(0, 5)));

    const visitedKey = storageKey(VISITED_PREFIX, scope);
    const visited = new Set(safeParseRecent(storage.getItem(visitedKey)).map((row) => row.href));
    visited.add(href);
    storage.setItem(
      visitedKey,
      JSON.stringify([...visited].map((visitedHref) => ({ href: visitedHref, label: visitedHref, openedAtUtc: record.openedAtUtc }))),
    );
  } catch {
    return;
  }
}

export function readSecureNowResumeAcceleratorOpen(scope: SecureNowStickinessScope): SecureNowAcceleratorOpenRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(RESUME_PREFIX, scope));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as SecureNowAcceleratorOpenRecord;
    return parsed.href?.trim().length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function readSecureNowRecentAcceleratorOpens(scope: SecureNowStickinessScope): readonly SecureNowAcceleratorOpenRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParseRecent(window.localStorage.getItem(storageKey(RECENT_PREFIX, scope)));
  } catch {
    return [];
  }
}

export function readSecureNowVisitedAcceleratorHrefs(scope: SecureNowStickinessScope): readonly string[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParseRecent(window.localStorage.getItem(storageKey(VISITED_PREFIX, scope))).map((row) => row.href);
  } catch {
    return [];
  }
}
