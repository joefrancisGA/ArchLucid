import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DIGESTS_SCHEDULE_CANONICAL_PATH = "/digests?tab=schedule" as const;

export const DIGESTS_SCHEDULE_CLAIM_DISCIPLINE =
  "Schedule settings control when digests are generated and who receives them — not a signed-review diligence Sources package. Do not imply CPA SOC 2 attestation or a published third-party pen test from this tab.";

export const DIGESTS_SCHEDULE_SOURCES_INTRO =
  "Use these follow-ups when cadence is set but delivery destinations, browse history, or advisory scans still need attention.";

export type DigestsScheduleSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/digests?tab=schedule`. */
export const DIGESTS_SCHEDULE_SOURCES: readonly DigestsScheduleSourceLink[] = [
  { label: "Subscriptions", href: "/digests?tab=subscriptions" },
  { label: "Browse digests", href: "/digests?tab=browse" },
  { label: "Advisory scan schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
