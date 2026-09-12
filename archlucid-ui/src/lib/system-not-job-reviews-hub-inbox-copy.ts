import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";
import { REVIEWS_HUB_CLAIM_DISCIPLINE } from "@/lib/reviews-hub-evidence-copy";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_REVIEWS_HUB_INBOX_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

/** SN-011 / ADR 0079 — Working reviews list is cross-architecture inbox, not Monday morning. */
export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_TITLE = WORKING_REVIEWS_INBOX_NAV_LABEL;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_PAGE_SUBTITLE =
  "Cross-architecture review inbox for this workspace — resume work from Architectures or your last open desk (Alt+R), not from here." as const;

/** Visible caption under the Working hub header — inbox triage vs architecture desk. */
export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION =
  "Triage every review job in one list. Named architecture desks under Architectures are where you continue work." as const;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION_TEST_ID =
  "reviews-hub-working-inbox-caption" as const;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_CLAIM_DISCIPLINE =
  "Inbox lists draft, active, and finalized jobs across architectures — not your Monday-morning desk. Open Architectures or press Alt+R to resume named systems." as const;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY =
  "Reviews appear here after you start a job from an architecture desk. Open Architectures to pick a system and resume work — Inbox is triage, not home." as const;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY =
  "Continue the draft from the header, or open Architectures to pick a system desk — Inbox lists jobs; desks own the work." as const;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY =
  "Pick an architecture ready for review below, or open Architectures to browse named systems — resume from a desk, not from Inbox alone." as const;

export const SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_OPEN_ARCHITECTURES_LABEL = "Open architectures" as const;

/** Claim discipline strip — Working inbox honesty; Guided keeps package list teaching. */
export function resolveSystemNotJobReviewsHubClaimDiscipline(workingMode: boolean): string {
  if (workingMode) {
    return SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_CLAIM_DISCIPLINE;
  }

  return REVIEWS_HUB_CLAIM_DISCIPLINE;
}
