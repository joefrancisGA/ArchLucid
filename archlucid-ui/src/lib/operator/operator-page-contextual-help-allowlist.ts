/**
 * TB-1670 — Unified allowlist for operator hubs that must mount `PageContextualHelpButton`
 * with a non-null `pageHelpTopicForPathname` row.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator page contextual help* (**TB-1666**).
 */

import { OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES } from "@/lib/operator/operator-governance-sponsor-page-help-surfaces";
import { OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES } from "@/lib/operator/operator-integrations-page-help-surfaces";
import { OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES } from "@/lib/operator/operator-pilot-analysis-page-help-surfaces";

export type OperatorPageContextualHelpAllowlistEntry = {
  readonly id: string;
  readonly pathname: string;
  readonly modulePath: string;
  readonly notes: string;
};

/** **TB-1666** shipped exemplars (pre–TB-1667 wave). */
export const OPERATOR_PAGE_CONTEXTUAL_HELP_TB1666_EXEMPLAR_SURFACES: readonly OperatorPageContextualHelpAllowlistEntry[] =
  [
    {
      id: "reviews-hub",
      pathname: "/architecture/reviews",
      modulePath: "app/(operator)/architecture/reviews/_sections/ReviewsHubHeaderActions.tsx",
      notes: "Reviews hub — review-packages help topic.",
    },
    {
      id: "architectures-list",
      pathname: "/architecture/architectures",
      modulePath: "app/(operator)/architecture/architectures/_sections/ArchitecturesHubHeaderActions.tsx",
      notes: "Architecture drafts list — getting-started help topic.",
    },
    {
      id: "architecture-digests",
      pathname: "/architecture/digests",
      modulePath: "components/digests/DigestsPageHeader.tsx",
      notes: "Architecture digests hub — digests help topic.",
    },
    {
      id: "improvement-planning",
      pathname: "/insights/improvement-planning",
      modulePath: "app/(operator)/insights/improvement-planning/_sections/PlanningPageHeader.tsx",
      notes: "Improvement planning — improvement-planning specialty help topic.",
    },
  ];

/** Canonical CI allowlist: exemplars + **TB-1667**?**TB-1669** mount waves. */
export const OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST: readonly OperatorPageContextualHelpAllowlistEntry[] =
  [
    ...OPERATOR_PAGE_CONTEXTUAL_HELP_TB1666_EXEMPLAR_SURFACES,
    ...OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES,
    ...OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES,
    ...OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES,
  ];
