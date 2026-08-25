import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

const SEALED_RECORDS_DETAIL_PREFIX = `${SIGNED_RECORDS_LIST_PATH}/`;

function manifestIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(SEALED_RECORDS_DETAIL_PREFIX)) {
    return null;
  }

  const remainder = path.slice(SEALED_RECORDS_DETAIL_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

function readRecentDecisionManifestId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const manifestId = manifestIdFromRecentHref(entry.href);

      if (manifestId !== null) {
        return manifestId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the decision register entry to pin as Continue last viewed. */
export function resolveContinueLastDecisionRegisterEntry(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): ArchitectureDecisionRegisterEntry | null {
  if (decisions.length === 0) {
    return null;
  }

  const recentManifestId = readRecentDecisionManifestId();

  if (recentManifestId !== null) {
    const manifestMatch = decisions.find((decision) => decision.manifestId === recentManifestId);

    if (manifestMatch !== undefined) {
      return manifestMatch;
    }
  }

  return (
    decisions
      .slice()
      .sort((left, right) => right.recordedAtUtc.localeCompare(left.recordedAtUtc))[0] ?? null
  );
}
