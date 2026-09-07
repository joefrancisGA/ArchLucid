import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";

export const REVIEW_PIN_RUN_PARAM = "pinRunId" as const;

const REVIEW_PATH_PREFIX = "/architecture/reviews/";

function normalizeRunId(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function readPinRunIdFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): string | null {
  return normalizeRunId(searchParams.get(REVIEW_PIN_RUN_PARAM));
}

export function readPinRunIdFromWindowLocation(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return readPinRunIdFromSearchParams(new URLSearchParams(window.location.search));
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

/** Most recent review-detail run id from operator recent-views storage (for hub pin targets). */
export function readRecentPrimaryReviewRunId(): string | null {
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

export function isValidPinRunId(primaryRunId: string, pinRunId: string | null | undefined): boolean {
  const primary = normalizeRunId(primaryRunId);
  const pin = normalizeRunId(pinRunId);

  if (primary === null || pin === null) {
    return false;
  }

  return primary !== pin;
}

export function buildReviewDetailPinHref(
  primaryRunId: string,
  pinRunId: string,
  options?: {
    readonly reviewTab?: string | null;
    readonly preserveSearch?: string | null;
  },
): string {
  const primary = normalizeRunId(primaryRunId);
  const pin = normalizeRunId(pinRunId);

  if (primary === null || pin === null || primary === pin) {
    return reviewDetailPath(pin ?? primary ?? "");
  }

  const params = new URLSearchParams(options?.preserveSearch ?? "");

  params.delete(REVIEW_PIN_RUN_PARAM);

  const reviewTab = options?.reviewTab?.trim() ?? params.get(REVIEW_DETAIL_TAB_PARAM)?.trim() ?? "";

  if (reviewTab.length > 0) {
    params.set(REVIEW_DETAIL_TAB_PARAM, reviewTab);
  }

  params.set(REVIEW_PIN_RUN_PARAM, pin);

  const base = reviewDetailPath(primary);
  const qs = params.toString();

  return qs.length > 0 ? `${base}?${qs}` : base;
}

/** Hub/compare entry: pin `pinRunId` beside the recent primary review when possible. */
export function buildPinReviewToDeskHref(args: {
  readonly pinRunId: string;
  readonly primaryRunId?: string | null;
}): string {
  const pin = normalizeRunId(args.pinRunId);

  if (pin === null) {
    return reviewDetailPath("");
  }

  const primary = normalizeRunId(args.primaryRunId) ?? readRecentPrimaryReviewRunId();

  if (primary === null || primary === pin) {
    return reviewDetailPath(pin);
  }

  return buildReviewDetailPinHref(primary, pin);
}

export function reviewPinRunHrefFromSearch(
  search: string,
  pinRunId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(search);

  if (pinRunId === null || pinRunId.trim().length === 0) {
    params.delete(REVIEW_PIN_RUN_PARAM);
  } else {
    params.set(REVIEW_PIN_RUN_PARAM, pinRunId.trim());
  }

  const qs = params.toString();

  return qs.length > 0 ? `${pathname}?${qs}` : pathname;
}

/** Updates `pinRunId` in the address bar without a Next.js soft navigation. */
export function writePinRunIdToUrl(pinRunId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (pinRunId === null || pinRunId.trim().length === 0) {
    url.searchParams.delete(REVIEW_PIN_RUN_PARAM);
  } else {
    url.searchParams.set(REVIEW_PIN_RUN_PARAM, pinRunId.trim());
  }

  window.history.replaceState(null, "", url.toString());
}
