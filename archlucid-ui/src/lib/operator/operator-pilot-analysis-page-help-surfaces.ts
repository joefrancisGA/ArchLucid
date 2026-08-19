/**
 * TB-1667 — Pilot + analysis hubs that must mount `PageContextualHelpButton` with a topic map row.
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator page contextual help* (**TB-1666**).
 */

export type OperatorPilotAnalysisPageHelpSurfaceEntry = {
  readonly id: string;
  readonly pathname: string;
  readonly modulePath: string;
  readonly notes: string;
};

/** Surfaces named in **TB-1667** (HOM `/` shipped 2026-08-03; remainder closed 2026-08-12). */
export const OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES: readonly OperatorPilotAnalysisPageHelpSurfaceEntry[] =
  [
    {
      id: "operator-home",
      pathname: "/",
      modulePath: "app/(operator)/_sections/OperatorHomePageHeader.tsx",
      notes: "Overview hero — Category-1 registry + first-architecture-review Learn more.",
    },
    {
      id: "sponsor-dashboard",
      pathname: "/architecture/sponsor-dashboard",
      modulePath: "components/sponsor/SponsorDashboardPageHero.tsx",
      notes: "Legacy `/dashboard` canonicalizes here; sponsor-dashboard help topic.",
    },
    {
      id: "first-review-guide",
      pathname: "/architecture/first-review-guide",
      modulePath: "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx",
      notes: "Retired `/onboarding` onboarding hub — getting-started help topic.",
    },
    {
      id: "evidence-graph",
      pathname: "/insights/evidence-graph",
      modulePath: "app/(operator)/insights/evidence-graph/_sections/GraphPageContent.tsx",
      notes: "Evidence graph — evidence-graph help topic.",
    },
    {
      id: "compare-two-reviews",
      pathname: "/insights/compare-two-reviews",
      modulePath: "app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx",
      notes: "Compare reviews — comparison-replay help topic.",
    },
    {
      id: "internal-replay",
      pathname: "/internal/validate-route",
      modulePath: "app/(operator)/internal/validate-route/_sections/ReplayFormView.tsx",
      notes: "Validate review replay — comparison-replay help topic.",
    },
    {
      id: "ask-review-questions",
      pathname: "/insights/ask-review-questions",
      modulePath: "app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx",
      notes: "Ask review questions — prior-manifest-retrieval help topic.",
    },
    {
      id: "search-review-evidence",
      pathname: "/insights/search-review-evidence",
      modulePath: "app/(operator)/insights/search-review-evidence/_sections/SearchPageView.tsx",
      notes: "Search evidence — evidence-trail help topic.",
    },
  ];
