import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const GOVERNANCE_ASSIGNED_TO_ME_CLAIM_DISCIPLINE =
  "Assigned to me is your personal remediation queue — not the full findings register or an audit export. Open a finding for evidence detail, or use Audit when you need export-ready records.";

export const GOVERNANCE_ASSIGNED_TO_ME_FOLLOW_UPS_TITLE =
  HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const GOVERNANCE_ASSIGNED_TO_ME_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "you need the workspace findings register, an architecture package, or export-ready activity records",
);

/** Operator Sources — no self-href to the assigned-to-me lane. */
export const GOVERNANCE_ASSIGNED_TO_ME_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;

const GOVERNANCE_ASSIGNED_TO_ME_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
]);

/** Orientation-strip Sources — excludes the current assigned-to-me lane. */
export const GOVERNANCE_ASSIGNED_TO_ME_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  GOVERNANCE_ASSIGNED_TO_ME_SOURCES.filter(
    (source) => !GOVERNANCE_ASSIGNED_TO_ME_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
