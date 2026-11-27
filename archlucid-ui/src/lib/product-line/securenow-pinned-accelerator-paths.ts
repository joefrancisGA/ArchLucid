import type { SecureNowStickinessScope } from "@/lib/product-line/securenow-stickiness";

const PINNED_PATHS_PREFIX = "securenow-pinned-accelerator-paths:" as const;
export const SECURENOW_PINNED_ACCELERATOR_PATHS_LIMIT = 3 as const;

export type SecureNowPinnedAcceleratorPath = {
  readonly href: string;
  readonly label: string;
};

export const SECURENOW_PINNABLE_ACCELERATOR_PATHS: readonly SecureNowPinnedAcceleratorPath[] = [
  { href: "/administration/securenow-scenario-walks#fixture-path-03", label: "Fixture path 03" },
  { href: "/help/specialty-walkthroughs", label: "Specialty templates" },
  { href: "/administration/securenow-first-hour", label: "First hour walk" },
] as const;

export const SECURENOW_PINNED_ACCELERATOR_PATHS_LEAD =
  "Pinned accelerators stay in this browser only. They are not tenant bookmarks or entitlements." as const;

function storageKey(scope: SecureNowStickinessScope): string {
  return `${PINNED_PATHS_PREFIX}${scope.tenantId.trim()}:${scope.workspaceId.trim()}`;
}

function safeParsePinned(raw: string | null): SecureNowPinnedAcceleratorPath[] {
  if (raw === null || raw.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SecureNowPinnedAcceleratorPath[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((row) => (row.href?.trim() ?? "").length > 0 && (row.label?.trim() ?? "").length > 0);
  } catch {
    return [];
  }
}

export function readSecureNowPinnedAcceleratorPaths(
  scope: SecureNowStickinessScope,
): readonly SecureNowPinnedAcceleratorPath[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return safeParsePinned(window.localStorage.getItem(storageKey(scope))).slice(0, SECURENOW_PINNED_ACCELERATOR_PATHS_LIMIT);
  } catch {
    return [];
  }
}

export function pinSecureNowAcceleratorPath(
  scope: SecureNowStickinessScope,
  input: SecureNowPinnedAcceleratorPath,
): void {
  if (typeof window === "undefined" || scope.workspaceId.trim().length === 0) {
    return;
  }

  const href = input.href.trim();
  const label = input.label.trim();

  if (href.length === 0 || label.length === 0) {
    return;
  }

  try {
    const storage = window.localStorage;
    const existing = safeParsePinned(storage.getItem(storageKey(scope))).filter((row) => row.href !== href);
    const next = [{ href, label }, ...existing].slice(0, SECURENOW_PINNED_ACCELERATOR_PATHS_LIMIT);
    storage.setItem(storageKey(scope), JSON.stringify(next));
  } catch {
    return;
  }
}

export function unpinSecureNowAcceleratorPath(scope: SecureNowStickinessScope, href: string): void {
  if (typeof window === "undefined" || scope.workspaceId.trim().length === 0) {
    return;
  }

  const trimmedHref = href.trim();

  if (trimmedHref.length === 0) {
    return;
  }

  try {
    const storage = window.localStorage;
    const next = safeParsePinned(storage.getItem(storageKey(scope))).filter((row) => row.href !== trimmedHref);
    storage.setItem(storageKey(scope), JSON.stringify(next));
  } catch {
    return;
  }
}

export function isSecureNowAcceleratorPathPinned(scope: SecureNowStickinessScope, href: string): boolean {
  const trimmedHref = href.trim();

  if (trimmedHref.length === 0) {
    return false;
  }

  return readSecureNowPinnedAcceleratorPaths(scope).some((row) => row.href === trimmedHref);
}
