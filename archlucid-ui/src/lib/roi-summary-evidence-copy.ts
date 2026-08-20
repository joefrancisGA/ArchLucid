import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";

export const ROI_SUMMARY_CANONICAL_PATH = "/insights/roi-summary";

export const ROI_SUMMARY_CLAIM_DISCIPLINE_HEADING = "What ROI summary is not";

export const ROI_SUMMARY_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.roiSummary;

export const ROI_SUMMARY_CLAIM_DISCIPLINE =
  "ROI summary hours and dollar estimates are directional portfolio metrics for the selected window — they are not invoices, audited financial reporting, or a signed-review evidence trail. Open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails.";

export const ROI_SUMMARY_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "ROI summary needs architecture reviews, methodology context, or assurance cites",
);


/** Operator Sources — no self-href to ROI summary. */
export const ROI_SUMMARY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Sponsor dashboard", href: "/architecture/sponsor-dashboard" },
  { label: "Sponsor report", href: "/insights/sponsor-report" },
  { label: "ROI methodology help", href: inAppHelpHref("sponsor-report") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
