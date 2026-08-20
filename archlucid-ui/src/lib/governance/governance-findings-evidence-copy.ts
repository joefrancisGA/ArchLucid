import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Alias for existing imports — prefer {@link GOVERNANCE_FINDINGS_PATH}. */
export const GOVERNANCE_FINDINGS_CANONICAL_PATH = GOVERNANCE_FINDINGS_PATH;

export const GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE =
  "Findings is the workspace queue for resolving findings across reviews — not a full audit export on its own. Open a finding detail, Evidence graph, or Audit when you need export-ready records.";

export const GOVERNANCE_FINDINGS_CLAIM_HEADING = "What the findings queue is not";

export const GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const GOVERNANCE_FINDINGS_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "queue triage turns into package detail, evidence search, or activity records",
);


/** Operator Sources — no self-href to the findings queue. */
export const GOVERNANCE_FINDINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
  { label: "Alert inbox", href: GOVERNANCE_ALERTS_PATH },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Findings help", href: inAppHelpHref("findings") },
] as const;
