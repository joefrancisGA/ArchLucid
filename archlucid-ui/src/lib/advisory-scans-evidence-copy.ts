import { ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY } from "@/lib/advisory-copy";
import { ADVISORY_SCANS_HREF, ADVISORY_SCANS_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  hubSecondaryFollowUpsIntro,
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink, EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";

export const ADVISORY_SCANS_CANONICAL_PATH = ADVISORY_SCANS_HREF;

export const ADVISORY_SCANS_CLAIM_DISCIPLINE_HEADING = "What advisory scans are not";

export const ADVISORY_SCANS_CLAIM_DISCIPLINE = ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY;

export const ADVISORY_SCANS_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const ADVISORY_SCANS_TAB_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "scan generation or disposition still needs schedules, architecture reviews, or advisory methodology help",
);

export const ADVISORY_SCANS_SOURCES_INTRO =
  "Follow-ups for architecture review intake, official activity records, AI spend signals, or product orientation.";

/** Operator Sources — no self-href to the default advisory-scans hub path or tile-covered destinations. */
export const ADVISORY_SCANS_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Architecture review guide",
    href: inAppHelpHref("review-guide"),
    when: "Finalize reviews and understand review lifecycle before generating scans",
  },
  {
    label: "Audit trail help",
    href: inAppHelpHref("audit-trail"),
    when: "Trace resolve events and assurance events tied to recommendations",
  },
  {
    label: "AI usage help",
    href: inAppHelpHref("ai-usage"),
    when: "Monitor estimated AI spend when scan generation adds model activity",
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Product orientation for architects new to advisory scans",
  },
] as const;

/** Operator Sources — no self-href to the scans tab. */
export const ADVISORY_SCANS_TAB_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Advisory scans", href: ADVISORY_SCANS_SCANS_HREF },
  { label: "Advisory schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Architecture review guide", href: inAppHelpHref("review-guide") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Advisory scans help", href: inAppHelpHref("advisory-scans") },
] as const;

const ADVISORY_SCANS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([ADVISORY_SCANS_SCANS_HREF]);

/** Scans-tab orientation Sources — excludes self-href to `?tab=scans`. */
export const ADVISORY_SCANS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = ADVISORY_SCANS_TAB_SOURCES.filter(
  (source) => !ADVISORY_SCANS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
