/**
 * Typed priority rows for WS-04 — mirrors `docs/architecture/WORKING_SEAT_EVAL_LEAK_INVENTORY.md`.
 * Shrink-only: do not use this module to grow `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`.
 */
export const WORKING_SEAT_EVAL_LEAK_INVENTORY_DOC_PATH =
  "docs/architecture/WORKING_SEAT_EVAL_LEAK_INVENTORY.md" as const;

export type WorkingSeatEvalLeakClass = "chrome" | "buyer-chrome" | "sample" | "first-week" | "fixture";

export type WorkingSeatEvalLeakRow = {
  readonly relativePath: string;
  readonly leakClass: WorkingSeatEvalLeakClass;
  readonly ownerPrompt: string;
};

/** Architecture / review / desk paths WS-06+ must shrink before admin/help grandfather rows. */
export const WORKING_SEAT_EVAL_LEAK_PRIORITY_PATHS: readonly WorkingSeatEvalLeakRow[] = [
  {
    relativePath: "app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageSubtitle.tsx",
    leakClass: "chrome",
    ownerPrompt: "WS-06",
  },
  {
    relativePath: "app/(operator)/architecture/reviews/[reviewId]/_sections/load-run-detail-deferred-model.ts",
    leakClass: "chrome",
    ownerPrompt: "WS-06",
  },
  {
    relativePath: "app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection.tsx",
    leakClass: "sample",
    ownerPrompt: "WS-06",
  },
  {
    relativePath: "components/shell/BuyerGoldenJourneyLayerContextStrip.tsx",
    leakClass: "buyer-chrome",
    ownerPrompt: "WS-09",
  },
  {
    relativePath: "hooks/use-effective-nav-committed-architecture-review.ts",
    leakClass: "chrome",
    ownerPrompt: "WS-06",
  },
] as const;
