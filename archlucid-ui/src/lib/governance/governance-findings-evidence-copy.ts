import { resolveWorkingArchitecturePortfolioParentLink } from "@/lib/resolve-working-evidence-parent-link";
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
export function buildGovernanceFindingsSources(
  workingMode: boolean,
): readonly EvidenceSourceLink[] {
  const reviewsParent = resolveWorkingArchitecturePortfolioParentLink(workingMode);

  return [
    { label: reviewsParent.label, href: reviewsParent.href },
    { label: "Alert inbox", href: GOVERNANCE_ALERTS_PATH },
    { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
    { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
    { label: "Search review evidence", href: "/insights/search-review-evidence" },
    { label: "Findings help", href: inAppHelpHref("findings") },
  ] as const;
}

const GOVERNANCE_FINDINGS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([GOVERNANCE_FINDINGS_PATH]);

/** Operator orientation Sources — excludes self-href to `/governance/findings` (GFN). */
export function buildGovernanceFindingsOrientationSources(
  workingMode: boolean,
): readonly EvidenceSourceLink[] {
  return buildGovernanceFindingsSources(workingMode).filter(
    (source) => !GOVERNANCE_FINDINGS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
}

/** Guided default — prefer {@link buildGovernanceFindingsSources}. */
export const GOVERNANCE_FINDINGS_SOURCES: readonly EvidenceSourceLink[] =
  buildGovernanceFindingsSources(false);
