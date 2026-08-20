import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_CANONICAL_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export { DIGESTS_SCHEDULE_CANONICAL_PATH };

export const DIGESTS_SCHEDULE_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.digestsSchedule;

export const DIGESTS_SCHEDULE_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "cadence is set but delivery destinations, browse history, or advisory scans still need attention",
);

/** Operator Sources — no self-href to the schedule tab. */
export const DIGESTS_SCHEDULE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Subscriptions", href: DIGESTS_SUBSCRIPTIONS_TAB_PATH },
  { label: "Browse digests", href: DIGESTS_BROWSE_TAB_PATH },
  { label: "Advisory scan schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Architecture digests help", href: inAppHelpHref("digests") },
] as const;

const DIGESTS_SCHEDULE_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  ADVISORY_SCANS_SCHEDULES_HREF,
]);

/** Orientation-strip Sources — excludes in-form and on-page schedule CTAs. */
export const DIGESTS_SCHEDULE_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  DIGESTS_SCHEDULE_SOURCES.filter(
    (source) => !DIGESTS_SCHEDULE_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
