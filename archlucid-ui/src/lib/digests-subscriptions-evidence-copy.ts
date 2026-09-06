import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  DIGESTS_BROWSE_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const DIGESTS_SUBSCRIPTIONS_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.digestsSchedule;

export const DIGESTS_SUBSCRIPTIONS_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "destinations are configured but cadence, browse history, or advisory scans still need attention",
);

/** Operator Sources — no self-href to the subscriptions tab. */
export const DIGESTS_SUBSCRIPTIONS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Browse digests", href: DIGESTS_BROWSE_TAB_PATH },
  { label: "Sponsor schedule", href: DIGESTS_SCHEDULE_TAB_PATH },
  { label: "Advisory scan schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Architecture digests help", href: inAppHelpHref("digests") },
] as const;

const DIGESTS_SUBSCRIPTIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  ADVISORY_SCANS_SCHEDULES_HREF,
  DIGESTS_SCHEDULE_TAB_PATH,
]);

/** Orientation-strip Sources — excludes in-tab and readiness CTAs. */
export const DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  DIGESTS_SUBSCRIPTIONS_SOURCES.filter(
    (source) => !DIGESTS_SUBSCRIPTIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
