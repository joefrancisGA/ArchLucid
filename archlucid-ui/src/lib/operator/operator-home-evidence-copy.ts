import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HUB_SECONDARY_FOLLOW_UPS_TITLES } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const OPERATOR_HOME_CANONICAL_PATH = "/";

export const OPERATOR_HOME_CLAIM_DISCIPLINE =
  "Overview is the home page for next steps and recent reviews — not a full audit export. Open Architecture reviews, Evidence trail, or Trust Center when you need export-ready records.";

export const OPERATOR_HOME_SOURCES_INTRO =
  "Use these when a completed review needs a sponsor briefing or findings triage. Start, resume, and explore from the cards above.";

/** Secondary destinations after on-page create / review / resume work — not the Home hero. */
export const OPERATOR_HOME_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.operatorHome;

/** Operator Sources — no self-href to Overview `/`. */
export const OPERATOR_HOME_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Start review", href: "/architecture/reviews/new" },
  { label: "Sponsor dashboard", href: "/architecture/sponsor-dashboard" },
  { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
  { label: "First architecture review help", href: inAppHelpHref("first-architecture-review") },
] as const;

const OPERATOR_HOME_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  "/architecture/reviews",
  "/architecture/reviews/new",
  inAppHelpHref("first-architecture-review"),
]);

/** Orientation-strip Sources — excludes on-page review CTAs and contextual-help topic. */
export const OPERATOR_HOME_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = OPERATOR_HOME_SOURCES.filter(
  (source) => !OPERATOR_HOME_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
