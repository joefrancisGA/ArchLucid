import { ADVISORY_SCANS_SCHEDULES_RECURRENCE_HREF } from "@/lib/advisory-copy";
import { ADVISORY_SCANS_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  hubSecondaryFollowUpsIntro,
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ADVISORY_SCHEDULES_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const ADVISORY_SCHEDULES_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "schedules are set but scan results, recurrence reviews, or advisory methodology still need attention",
);

/** Operator Sources — no self-href to the schedules tab. */
export const ADVISORY_SCHEDULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Advisory scans", href: ADVISORY_SCANS_SCANS_HREF },
  { label: "Recurrence schedules", href: ADVISORY_SCANS_SCHEDULES_RECURRENCE_HREF },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Advisory scans help", href: inAppHelpHref("advisory-scans") },
] as const;

const ADVISORY_SCHEDULES_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([ADVISORY_SCANS_SCHEDULES_HREF]);

/** Orientation-strip Sources — excludes in-form and on-page schedule CTAs. */
export const ADVISORY_SCHEDULES_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  ADVISORY_SCHEDULES_SOURCES.filter(
    (source) => !ADVISORY_SCHEDULES_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
