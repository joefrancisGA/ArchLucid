import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
import { SIMPLIFIED_PILOT_ADVANCED_CONFIG_OPEN_PARAM } from "@/lib/architecture/simplified-pilot-advanced-config-disclosure-url";
import { GUIDED_INTAKE_VIEW_ALL_CLARIFICATIONS_OPEN_PARAM } from "@/lib/guided-intake/guided-intake-view-all-clarifications-disclosure-url";
import { FIRST_PILOT_STANDARDS_SELECTION_OPEN_PARAM } from "@/lib/reviews/first-pilot-standards-selection-disclosure-url";
import { REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM } from "@/lib/reviews/reviews-new-more-ways-to-start-disclosure-url";
import { REVIEWS_NEW_RETURNING_JOB_CHOOSER_OPEN_PARAM } from "@/lib/reviews/reviews-new-returning-job-chooser-disclosure-url";
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

/** Templates/detailed and guided-intake tabs mount the full wizard without quick-start collapse. */
export function isEmbeddedFullWizardPathQuery(pathQuery: string): boolean {
  const normalized = pathQuery.trim().toLowerCase();

  return normalized === "detailed" || normalized === "guided-intake";
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

/** Switches review intake paths while preserving unrelated query keys (TB-1867). */
export function reviewsNewPathHrefFromSearch(
  currentSearch: string,
  path: ReviewsNewActivePath,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
      params.set("path", path);
      if (path === "quick-review") {
        params.delete("baseline");
        params.delete("accelerator");
        params.delete("preset");
        params.delete("template");
        params.delete("example");
        params.delete(FIRST_PILOT_STANDARDS_SELECTION_OPEN_PARAM);
        params.delete(SIMPLIFIED_PILOT_ADVANCED_CONFIG_OPEN_PARAM);
        params.delete(REVIEWS_NEW_MORE_WAYS_TO_START_OPEN_PARAM);
        params.delete(REVIEWS_NEW_RETURNING_JOB_CHOOSER_OPEN_PARAM);
        params.delete(GUIDED_INTAKE_VIEW_ALL_CLARIFICATIONS_OPEN_PARAM);
      }

      params.delete("intakeStep");
      params.delete("scopeGate");

      if (path !== "detailed") {
        params.delete("step");
        params.delete("mode");
        params.delete("pilot");
        params.delete("advancedConfig");
        params.delete("evidenceSource");
        params.delete("demoScenario");
      }
    },
  });
}
