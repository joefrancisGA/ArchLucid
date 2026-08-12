import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT } from "@/lib/guided-intake-copy";

/** Collapsed summary on architecture draft list and editor pages (TB-766). */
export const ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_SUMMARY = "Architecture draft vs. review" as const;

/** Primary draft-vs-review distinction — shared with guided intake creation copy. */
export const ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_LEAD = GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT;

/** Resumable draft behavior and the explicit review start action. */
export const ARCHITECTURE_DRAFT_GUIDANCE_DISCLOSURE_DETAIL =
  `Save and return anytime from ${ARCHITECTURE_DRAFTS_LIST_LABEL}. Starting an architecture review is a separate step — use Start architecture review when the draft is ready.` as const;

/** Permanent dismiss for veterans who no longer need the draft-vs-review explanation. */
export const ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_LABEL = "Hide this tip" as const;
