const AUDIT_RECENT_SAVED_VIEWS_STORAGE_KEY = "archlucid.audit-recent-saved-views.v1";
const MAX_RECENT_SAVED_VIEWS = 3;

export type AuditRecentSavedViewEntry = {
  readonly viewId: string;
  readonly name: string;
};

export function readAuditRecentSavedViews(): readonly AuditRecentSavedViewEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(AUDIT_RECENT_SAVED_VIEWS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry): entry is AuditRecentSavedViewEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as AuditRecentSavedViewEntry).viewId === "string" &&
          typeof (entry as AuditRecentSavedViewEntry).name === "string",
      )
      .slice(0, MAX_RECENT_SAVED_VIEWS);
  } catch {
    return [];
  }
}

export function recordAuditRecentSavedView(entry: AuditRecentSavedViewEntry): readonly AuditRecentSavedViewEntry[] {
  if (entry.viewId.trim().length === 0 || typeof window === "undefined") {
    return readAuditRecentSavedViews();
  }

  const withoutDup = readAuditRecentSavedViews().filter((candidate) => candidate.viewId !== entry.viewId);
  const next = [{ viewId: entry.viewId, name: entry.name }, ...withoutDup].slice(0, MAX_RECENT_SAVED_VIEWS);

  try {
    window.localStorage.setItem(AUDIT_RECENT_SAVED_VIEWS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }

  return next;
}

export function clearAuditRecentSavedViews(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUDIT_RECENT_SAVED_VIEWS_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
