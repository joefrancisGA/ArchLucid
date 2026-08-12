/**
 * TB-1674 — Migrated inline-link surfaces (finding badges + secondary hubs).
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator / marketing inline links* (**TB-1671**).
 *
 * Residual bare-link sweeps and Vitest guard: **TB-1675**.
 */

export type OperatorInlineLinkTb1674Surface = {
  readonly id: string;
  readonly modulePath: string;
  readonly notes: string;
};

/** Surfaces migrated under **TB-1674** (2026-08-12). */
export const OPERATOR_INLINE_LINK_TB1674_MIGRATED_SURFACES: readonly OperatorInlineLinkTb1674Surface[] = [
  {
    id: "finding-policy-pack-badge",
    modulePath: "components/findings/FindingPolicyPackBadge.tsx",
    notes: "StatusTag-as-link — OPERATOR_LINK.inline on pack deep link.",
  },
  {
    id: "finding-policy-rule-badge",
    modulePath: "components/findings/FindingPolicyRuleBadge.tsx",
    notes: "StatusTag-as-link — OPERATOR_LINK.inline on rule deep link.",
  },
  {
    id: "product-learning-export-row",
    modulePath: "app/(operator)/internal/product-learning/_sections/ProductLearningPageView.tsx",
    notes: "Pilot feedback export anchors — OPERATOR_LINK.inline.",
  },
  {
    id: "planning-plans-table",
    modulePath: "components/planning/PlanningPlansTable.tsx",
    notes: "Plan title column — OPERATOR_LINK.nav (replaces ad-hoc blue).",
  },
  {
    id: "planning-export-json-browser",
    modulePath: "components/planning/PlanningExportReadinessNote.tsx",
    notes: "Technical Open JSON link — OPERATOR_LINK.inline.",
  },
  {
    id: "evolution-simulation-run-diff",
    modulePath: "components/evolution/SimulationRunDiffCard.tsx",
    notes: "Baseline + linked review IDs — OPERATOR_LINK.inline + mono.",
  },
  {
    id: "nav-pinned-links-panel",
    modulePath: "components/usability/NavPinnedLinksPanel.tsx",
    notes: "Pinned sidebar labels — OPERATOR_LINK.nav.",
  },
  {
    id: "contextual-help-learn-more",
    modulePath: "components/ContextualHelp.tsx",
    notes: "Field help Learn more — OPERATOR_LINK.optional (resting underline).",
  },
  {
    id: "page-scoped-contextual-help-learn-more",
    modulePath: "components/usability/PageScopedContextualHelpPanel.tsx",
    notes: "Page help Learn more — OPERATOR_LINK.optional.",
  },
];

/**
 * Known residuals intentionally deferred to **TB-1675** (not exhaustive — Vitest guard will grow the list).
 */
export const OPERATOR_INLINE_LINK_TB1675_RESIDUAL_HINTS: readonly string[] = [
  "components/CorePilotNextStepsCard.tsx — ad-hoc text-blue-700 marketing/operator links",
  "components/runs/RunInspectorPreview.tsx — bare View evidence graph links",
  "components/ArchitectureGraphViewer.tsx — mixed link styling on graph explorer",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailArchitectureGraphSection.tsx — bare Open evidence graph",
  "Ghost Button asChild link wrappers — TB-2170–TB-2173 sweeps",
];
