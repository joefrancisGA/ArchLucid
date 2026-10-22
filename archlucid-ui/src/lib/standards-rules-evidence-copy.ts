import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Workbook path for GRS standards-and-rules hub. */
export const STANDARDS_RULES_CANONICAL_PATH = GOVERNANCE_STANDARDS_AND_RULES_PATH;

export const STANDARDS_RULES_CLAIM_DISCIPLINE_HEADING = "What standards & rules is not";

export const STANDARDS_RULES_CLAIM_DISCIPLINE =
  "Standards & rules shows effective policy resolution and applied rule rows for the current scope — not a finalized review record on its own. Export a diagnostic report when you need a point-in-time citeable snapshot, then open Findings or Policy packs for follow-up.";

export const STANDARDS_RULES_SOURCES_INTRO =
  "Use these follow-ups when resolution questions turn into pack authoring, findings, or assurance orientation.";

export const STANDARDS_RULES_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const STANDARDS_RULES_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "applied rule questions turn into pack authoring, findings, or assurance orientation",
);

/** Operator Sources — no self-href to /governance/standards-and-rules. */
export const STANDARDS_RULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

const STANDARDS_RULES_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([STANDARDS_RULES_CANONICAL_PATH]);

/** Operator orientation Sources — excludes self-href to `/governance/standards-and-rules` (GRS). */
export const STANDARDS_RULES_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = STANDARDS_RULES_SOURCES.filter(
  (source) => !STANDARDS_RULES_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
