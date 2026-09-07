import {
  resolveArchitectureReviewHref,
  reviewDetailPath,
} from "@/lib/architecture/architecture-routes";
import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";
import { extractReviewIdFromPathname } from "@/lib/desk-continuity-preference";
import { REVIEW_DETAIL_TAB_PARAM } from "@/lib/review-detail-workspace-tabs";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";

export const REVIEW_PIN_RUN_PARAM = "pinRunId" as const;

export type RecentPrimaryReviewDeskTarget = {
  readonly primaryRunId: string;
  readonly architectureId: string | null;
};

function normalizeRunId(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeArchitectureId(value: string | null | undefined): string | null {
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

function deskTargetFromRecentHref(href: string): RecentPrimaryReviewDeskTarget | null {
  const path = href.split("?")[0] ?? "";
  const runId = extractReviewIdFromPathname(path);

  if (runId === null) {
    return null;
  }

  const nested = parseArchitectureNestedRoute(path);
  const architectureId =
    nested?.childKind === "reviews" ? normalizeArchitectureId(nested.architectureId) : null;

  return {
    primaryRunId: runId,
    architectureId,
  };
}

/** Most recent review-detail desk target from operator recent-views storage (for hub pin targets). */
export function readRecentPrimaryReviewDeskTarget(): RecentPrimaryReviewDeskTarget | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const fromHref = deskTargetFromRecentHref(entry.href);

      if (fromHref !== null) {
        const architectureId =
          normalizeArchitectureId(entry.parentArchitectureId) ?? fromHref.architectureId;

        return {
          primaryRunId: fromHref.primaryRunId,
          architectureId,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** @deprecated Prefer {@link readRecentPrimaryReviewDeskTarget}. */
export function readRecentPrimaryReviewRunId(): string | null {
  return readRecentPrimaryReviewDeskTarget()?.primaryRunId ?? null;
}

export function isValidPinRunId(primaryRunId: string, pinRunId: string | null | undefined): boolean {
  const primary = normalizeRunId(primaryRunId);
  const pin = normalizeRunId(pinRunId);

  if (primary === null || pin === null) {
    return false;
  }

  return primary !== pin;
}

function resolveReviewDetailBaseHref(
  primaryRunId: string,
  architectureId?: string | null,
): string {
  const primary = normalizeRunId(primaryRunId);

  if (primary === null) {
    return reviewDetailPath("");
  }

  return resolveArchitectureReviewHref(primary, architectureId);
}

export function buildReviewDetailPinHref(
  primaryRunId: string,
  pinRunId: string,
  options?: {
    readonly reviewTab?: string | null;
    readonly preserveSearch?: string | null;
    readonly architectureId?: string | null;
  },
): string {
  const primary = normalizeRunId(primaryRunId);
  const pin = normalizeRunId(pinRunId);

  if (primary === null || pin === null || primary === pin) {
    return resolveReviewDetailBaseHref(pin ?? primary ?? "", options?.architectureId);
  }

  const params = new URLSearchParams(options?.preserveSearch ?? "");

  params.delete(REVIEW_PIN_RUN_PARAM);

  const reviewTab = options?.reviewTab?.trim() ?? params.get(REVIEW_DETAIL_TAB_PARAM)?.trim() ?? "";

  if (reviewTab.length > 0) {
    params.set(REVIEW_DETAIL_TAB_PARAM, reviewTab);
  }

  params.set(REVIEW_PIN_RUN_PARAM, pin);

  const base = resolveReviewDetailBaseHref(primary, options?.architectureId);
  const qs = params.toString();

  return qs.length > 0 ? `${base}?${qs}` : base;
}

/** Hub/compare entry: pin `pinRunId` beside the recent primary review when possible. */
export function buildPinReviewToDeskHref(args: {
  readonly pinRunId: string;
  readonly primaryRunId?: string | null;
  readonly architectureId?: string | null;
}): string {
  const pin = normalizeRunId(args.pinRunId);

  if (pin === null) {
    return reviewDetailPath("");
  }

  const recent = readRecentPrimaryReviewDeskTarget();
  const primary = normalizeRunId(args.primaryRunId) ?? recent?.primaryRunId ?? null;
  const architectureId = normalizeArchitectureId(args.architectureId) ?? recent?.architectureId ?? null;

  if (primary === null || primary === pin) {
    return resolveArchitectureReviewHref(pin, architectureId);
  }

  return buildReviewDetailPinHref(primary, pin, { architectureId });
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
