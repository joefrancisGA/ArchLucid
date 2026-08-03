import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DIGESTS_CLAIM_DISCIPLINE =
  "Digest previews and schedules summarize workspace activity for operators — not a signed-review diligence Sources trail. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const DIGESTS_SOURCES_INTRO =
  "Configure subscriptions and schedule before treating digests as an operating rhythm; open reviews or findings when a summary needs follow-up.";

export type DigestsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/digests`. */
export const DIGESTS_SOURCES: readonly DigestsSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: "/governance/findings" },
  { label: "Advisory scan schedules", href: ADVISORY_SCANS_SCHEDULES_HREF },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
  { label: "Alerts help", href: inAppHelpHref("alerts") },
] as const;

export const DIGESTS_CANONICAL_PATH = "/digests" as const;
