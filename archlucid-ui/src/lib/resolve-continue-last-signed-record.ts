import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import type { SignedRecordsListRow } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";
import { isSignedRecordsListRowOpenable } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";

const SIGNED_RECORDS_DETAIL_PREFIX = `${SIGNED_RECORDS_LIST_PATH}/`;
const REVIEW_PATH_PREFIX = "/architecture/reviews/";

function manifestIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(SIGNED_RECORDS_DETAIL_PREFIX)) {
    return null;
  }

  const remainder = path.slice(SIGNED_RECORDS_DETAIL_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

function runIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(REVIEW_PATH_PREFIX)) {
    return null;
  }

  const remainder = path.slice(REVIEW_PATH_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

function readRecentSignedRecordManifestId(): string | null {
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

function readRecentSignedRecordRunId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const runId = runIdFromRecentHref(entry.href);

      if (runId !== null) {
        return runId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the sealed record row to pin as Continue last viewed on the list. */
export function resolveContinueLastSignedRecordsListRow(rows: unknown): SignedRecordsListRow | null {
  const normalizedRows = asNonemptyReadonlyArray<SignedRecordsListRow>(rows);

  if (normalizedRows === null) {
    return null;
  }

  const recentManifestId = readRecentSignedRecordManifestId();

  if (recentManifestId !== null) {
    const manifestMatch = normalizedRows.find((row) => row.manifestId === recentManifestId);

    if (manifestMatch !== undefined && isSignedRecordsListRowOpenable(manifestMatch)) {
      return manifestMatch;
    }
  }

  const recentRunId = readRecentSignedRecordRunId();

  if (recentRunId !== null) {
    const runMatch = normalizedRows.find((row) => row.runId === recentRunId);

    if (runMatch !== undefined && isSignedRecordsListRowOpenable(runMatch)) {
      return runMatch;
    }
  }

  const openableRows = normalizedRows.filter((row) => isSignedRecordsListRowOpenable(row));

  if (openableRows.length === 0) {
    return null;
  }

  return (
    openableRows
      .slice()
      .sort((left, right) => right.committedUtc.localeCompare(left.committedUtc))[0] ?? null
  );
}
