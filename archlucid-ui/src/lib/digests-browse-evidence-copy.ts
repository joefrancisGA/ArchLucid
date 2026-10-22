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
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const DIGESTS_BROWSE_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.digestsSchedule;

export const DIGESTS_BROWSE_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "the setup checklist or browse history surfaces a missing subscription, schedule, or review follow-up",
);

/** Operator Sources — no self-href to the Get started tab. */
export const DIGESTS_BROWSE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Subscriptions", href: DIGESTS_SUBSCRIPTIONS_TAB_PATH },
  { label: "Sponsor schedule", href: DIGESTS_SCHEDULE_TAB_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Advisory scan schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Architecture digests help", href: inAppHelpHref("digests") },
] as const;

const DIGESTS_BROWSE_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  DIGESTS_SCHEDULE_TAB_PATH,
  ADVISORY_SCANS_SCHEDULES_HREF,
  DIGESTS_BROWSE_TAB_PATH,
]);

/** Orientation-strip Sources — excludes in-tab and checklist CTAs. */
export const DIGESTS_BROWSE_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  DIGESTS_BROWSE_SOURCES.filter(
    (source) => !DIGESTS_BROWSE_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
