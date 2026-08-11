/**
 * Source of truth for `/governance/audit` Story vs Table presentation (TB-2229).
 * Defaults: story for buyer-polished shell, table for full operator.
 */

export type AuditTrailViewMode = "story" | "table";

export const AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY = "archlucid.audit.viewMode.v1" as const;

export const AUDIT_TRAIL_VIEW_STORY_LABEL = "Story" as const;

export const AUDIT_TRAIL_VIEW_TABLE_LABEL = "Table" as const;

export const AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL = "Audit trail view" as const;

/** Story mode: package narrative in buyer nouns (architecture package, decisions, evidence trail). */
export const AUDIT_TRAIL_VIEW_STORY_INTRO =
  "What happened to this architecture package — milestones in sponsor language for decisions, governance approval, and the evidence trail." as const;

/** Table mode: compact event dump (operator or sponsor preferring a list). */
export const AUDIT_TRAIL_VIEW_TABLE_INTRO =
  "Event list for this architecture package — each row is one audit event with who acted, what changed, and when." as const;

const AUDIT_TRAIL_VIEW_MODES: ReadonlyArray<AuditTrailViewMode> = ["story", "table"];

export function isAuditTrailViewMode(value: unknown): value is AuditTrailViewMode {
  return typeof value === "string" && AUDIT_TRAIL_VIEW_MODES.includes(value as AuditTrailViewMode);
}

/** Default when no persisted preference exists. */
export function defaultAuditTrailViewMode(buyerPolishedShell: boolean): AuditTrailViewMode {
  if (buyerPolishedShell) {
    return "story";
  }

  return "table";
}

export function parseAuditTrailViewMode(raw: string | null): AuditTrailViewMode | null {
  if (raw === null) {
    return null;
  }

  const trimmed = raw.trim();

  if (!isAuditTrailViewMode(trimmed)) {
    return null;
  }

  return trimmed;
}

export function readAuditTrailViewModeFromStorage(): AuditTrailViewMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseAuditTrailViewMode(window.localStorage.getItem(AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeAuditTrailViewModeToStorage(mode: AuditTrailViewMode): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!isAuditTrailViewMode(mode)) {
    return;
  }

  try {
    window.localStorage.setItem(AUDIT_TRAIL_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* private mode / quota */
  }
}

/** Prefer stored preference; otherwise shell-sensible default. */
export function resolveAuditTrailViewMode(args: {
  readonly buyerPolishedShell: boolean;
  readonly storedMode: AuditTrailViewMode | null;
}): AuditTrailViewMode {
  if (args.storedMode !== null) {
    return args.storedMode;
  }

  return defaultAuditTrailViewMode(args.buyerPolishedShell);
}
