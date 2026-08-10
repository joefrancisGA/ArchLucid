export const REVIEWS_NEW_PATH_STORAGE_KEY = "archlucid_reviews_new_path_v2";

export type ReviewsNewPathMode = "quick-review" | "full-guided";

/** Active creation path — maps to persisted storage keys and wizard component. */
export type ReviewsNewActivePath = "guided-intake" | "quick-review" | "detailed";

type FullGuidedSubMode = "guided-intake" | "detailed";

function readStoredPathMode(): ReviewsNewPathMode {
  if (typeof window === "undefined") {
    return "quick-review";
  }

  try {
    const raw = window.localStorage.getItem(REVIEWS_NEW_PATH_STORAGE_KEY);

    if (raw === "full-guided" || raw === "quick-review") {
      return raw;
    }

    if (raw === "detailed" || raw === "guided-intake") {
      return "full-guided";
    }

    const legacy = window.localStorage.getItem("archlucid_reviews_new_path_v1");

    if (legacy === "detailed" || legacy === "guided-intake") {
      return "full-guided";
    }

    if (legacy === "quick-review") {
      return legacy;
    }
  } catch {
    /* ignore */
  }

  return "quick-review";
}

function readStoredFullGuidedSubMode(): FullGuidedSubMode {
  if (typeof window === "undefined") {
    return "guided-intake";
  }

  try {
    const raw = window.localStorage.getItem("archlucid_reviews_new_full_guided_sub_v1");

    if (raw === "detailed" || raw === "guided-intake") {
      return raw;
    }
  } catch {
    /* ignore */
  }

  return "guided-intake";
}

export function readStoredActivePath(): ReviewsNewActivePath {
  const pathMode = readStoredPathMode();

  if (pathMode === "quick-review") {
    return "quick-review";
  }

  const subMode = readStoredFullGuidedSubMode();

  return subMode === "detailed" ? "detailed" : "guided-intake";
}

type ResolveInitialReviewsNewActivePathInput = {
  readonly pathQuery: string;
  readonly baselineFirst: boolean;
  readonly presetGreenfield: boolean;
  readonly activeTour: boolean;
};

/** Bare `/architecture/reviews/new` opens review quick start — not a persisted guided/architecture draft path. */
export function resolveInitialReviewsNewActivePath(
  input: ResolveInitialReviewsNewActivePathInput,
): ReviewsNewActivePath {
  const normalizedPath = input.pathQuery.trim().toLowerCase();

  if (normalizedPath === "quick-review") {
    return "quick-review";
  }

  if (normalizedPath === "guided-intake") {
    return "guided-intake";
  }

  if (normalizedPath === "detailed") {
    return "detailed";
  }

  if (input.baselineFirst || input.presetGreenfield) {
    return "detailed";
  }

  if (input.activeTour) {
    return "quick-review";
  }

  return "quick-review";
}

function persistPathMode(mode: ReviewsNewPathMode): void {
  try {
    window.localStorage.setItem(REVIEWS_NEW_PATH_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function persistFullGuidedSubMode(mode: FullGuidedSubMode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("archlucid_reviews_new_full_guided_sub_v1", mode);
  } catch {
    /* ignore */
  }
}

export function persistActivePath(path: ReviewsNewActivePath): void {
  if (path === "quick-review") {
    persistPathMode("quick-review");

    return;
  }

  persistPathMode("full-guided");
  persistFullGuidedSubMode(path === "detailed" ? "detailed" : "guided-intake");
}

/** Rewrites `path` while preserving unrelated query keys (TB-1867). */
export function buildReviewsNewPathHref(
  pathname: string,
  path: ReviewsNewActivePath,
  searchParams: URLSearchParams,
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.set("path", path);

  const query = next.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}
