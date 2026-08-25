import type { RiskExceptionRecord } from "@/lib/api/governance-stickiness-api";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";

export const RISK_EXCEPTION_LAST_VIEWED_STORAGE_KEY = "archlucid_risk_exception_continue_last_v1";

const REVIEW_FINDING_HREF_PATTERN = /^\/architecture\/reviews\/([^/]+)\/findings\/([^/]+)/i;

export type RiskExceptionsContinueLastTarget = {
  readonly riskExceptionId: string;
  readonly findingId: string;
  readonly rationale: string;
  readonly href: string | null;
};

function findingIdFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";
  const match = REVIEW_FINDING_HREF_PATTERN.exec(path);

  if (match === null) {
    return null;
  }

  const findingId = decodeURIComponent(match[2] ?? "").trim();

  return findingId.length > 0 ? findingId : null;
}

function readStoredExceptionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(RISK_EXCEPTION_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    if (stored.length > 0) {
      return stored;
    }

    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const findingId = findingIdFromRecentHref(entry.href);

      if (findingId !== null) {
        return findingId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function writeRiskExceptionLastViewedId(riskExceptionId: string): void {
  const normalized = riskExceptionId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RISK_EXCEPTION_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(record: RiskExceptionRecord): RiskExceptionsContinueLastTarget {
  const runId = record.runId?.trim() ?? "";

  return {
    riskExceptionId: record.riskExceptionId,
    findingId: record.findingId,
    rationale: record.rationale,
    href: runId.length > 0 ? getFindingDetailHref(runId, record.findingId) : null,
  };
}

/** Resolves the exception to pin as Continue last viewed. */
export function resolveContinueLastRiskException(
  records: readonly RiskExceptionRecord[],
): RiskExceptionsContinueLastTarget | null {
  if (records.length === 0) {
    return null;
  }

  const storedKey = readStoredExceptionId();

  if (storedKey !== null) {
    const idMatch = records.find((record) => record.riskExceptionId === storedKey);

    if (idMatch !== undefined) {
      return toTarget(idMatch);
    }

    const findingMatch = records.find((record) => record.findingId === storedKey);

    if (findingMatch !== undefined) {
      return toTarget(findingMatch);
    }
  }

  const mostRecent = records.slice().sort((left, right) => right.riskExceptionId.localeCompare(left.riskExceptionId))[0];

  return mostRecent === undefined ? null : toTarget(mostRecent);
}
