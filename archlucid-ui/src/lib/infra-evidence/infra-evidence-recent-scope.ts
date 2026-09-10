import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

const RECENT_SCOPE_LIMIT = 5;

export const INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT = "archlucid:infra-evidence-recent-scope-changed";

export type InfraEvidenceRecentScopeEntry = {
  readonly label: string;
  readonly href: string;
  readonly savedAtMs: number;
};

function resolveRecentScopeStorageKey(): string {
  const tenantId = readOperatorScopeFromStorage()?.tenantId?.trim() ?? "unknown";

  return `archlucid.infra-evidence.recent-scopes.${tenantId}`;
}

function readRecentScopeEntries(): InfraEvidenceRecentScopeEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(resolveRecentScopeStorageKey());

    if (raw == null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as InfraEvidenceRecentScopeEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        entry != null
        && typeof entry.label === "string"
        && typeof entry.href === "string"
        && typeof entry.savedAtMs === "number",
    );
  }
  catch {
    return [];
  }
}

function writeRecentScopeEntries(entries: readonly InfraEvidenceRecentScopeEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(resolveRecentScopeStorageKey(), JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(INFRA_EVIDENCE_RECENT_SCOPE_CHANGED_EVENT));
  }
  catch {
    // sessionStorage may be unavailable or quota-exhausted in private mode.
  }
}

export function recordInfraEvidenceRecentScope(entry: {
  readonly label: string;
  readonly href: string;
}): void {
  const trimmedLabel = entry.label.trim();
  const trimmedHref = entry.href.trim();

  if (trimmedLabel.length === 0 || trimmedHref.length === 0) {
    return;
  }

  const nextEntry: InfraEvidenceRecentScopeEntry = {
    label: trimmedLabel,
    href: trimmedHref,
    savedAtMs: Date.now(),
  };
  const deduped = readRecentScopeEntries().filter((existing) => existing.href !== trimmedHref);
  const merged = [nextEntry, ...deduped].slice(0, RECENT_SCOPE_LIMIT);

  writeRecentScopeEntries(merged);
}

export function readInfraEvidenceRecentScopes(
  currentHref?: string | null,
): InfraEvidenceRecentScopeEntry[] {
  const trimmedCurrentHref = currentHref?.trim() ?? "";

  return readRecentScopeEntries().filter((entry) => entry.href !== trimmedCurrentHref);
}
