import { ARCHITECTURES_LIST_PATH, ARCHITECTURES_NEW_PATH, REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ARCHITECTURES_LIST_CANONICAL_PATH = ARCHITECTURES_LIST_PATH;

export const ARCHITECTURES_LIST_CLAIM_DISCIPLINE =
  "The architectures list shows saved drafts only — browsing here does not start a review. Use Create architecture or Start a review when you are ready to draft or file evidence.";

export const ARCHITECTURES_LIST_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.architecturesHub;

export const ARCHITECTURES_LIST_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "you are ready to create a draft, start a review, or need first-run orientation",
);


/** Operator Sources - no self-href to `/architecture/architectures`. */
export const ARCHITECTURES_LIST_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Create architecture", href: ARCHITECTURES_NEW_PATH },
  { label: "Start a review", href: REVIEWS_NEW_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
