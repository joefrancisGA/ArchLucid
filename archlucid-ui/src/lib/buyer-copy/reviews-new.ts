/**
 * Start-a-review copy — intake entry, specimen preview, and sample escape links.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";

export const NEW_REVIEW_SAMPLE_ESCAPE_CTA =
  "See a completed signed review record and its evidence trail.";

export const NEW_REVIEW_SAMPLE_ESCAPE_HINT =
  "Skip setup and explore a finished signed review record.";

/** TB-2151 — pre-intake specimen preview on `/architecture/reviews/new` and home start CTAs. */
export const REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE = "See what you will get";

export const REVIEWS_NEW_SPECIMEN_PREVIEW_LEAD =
  "Open the Claims Intake Demo specimen — a signed review record with findings — before you commit to intake.";

export const REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA = "Open sample signed review record";

export const REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK = "View sample findings";

/** Streamlined first-run lead on `/architecture/reviews/new` — avoids path-switcher jargon above the fold. */
export const REVIEWS_NEW_PAGE_LEAD = CLOUD_NEUTRAL_PRIMARY_COPY.reviewsNewPageLead;

export const QUICK_REVIEW_SAMPLE_BRIEF_CAPTION = "Sample — edit freely";

export const BUYER_NEW_REVIEW_TOAST_CATEGORY = CREATE_ARCHITECTURE_LABEL;

/** Form section heading when the user is defining the governed review artifact. */
export const CREATE_REVIEW_PACKAGE_HEADING = "Create review";

export const BUYER_START_ARCHITECTURE_REVIEW_CTA = "Start an architecture review";

export const REVIEWS_NEW_OTHER_PATHS_DISCLOSURE = "Other ways to start a review";
