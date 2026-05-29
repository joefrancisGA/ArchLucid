export const FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY = "Recommended first-session path";

export type FirstWeekRouteGuidanceVariant =
  | "home"
  | "onboarding"
  | "new-review"
  | "reviews-list"
  | "review-detail-in-progress"
  | "review-detail-committed";

export type FirstWeekRouteGuidanceAction = {
  readonly label: string;
  readonly href: string;
};

export type FirstWeekRouteGuidanceConfig = {
  readonly useWhen: string;
  readonly bridgeCopy: string;
  readonly primaryAction: FirstWeekRouteGuidanceAction;
  readonly operateDeferralNote: string;
};

export const FIRST_WEEK_ROUTE_GUIDANCE: Record<FirstWeekRouteGuidanceVariant, FirstWeekRouteGuidanceConfig> = {
  home: {
    useWhen: "You are in your first pilot session and need the shortest path to a committed review package.",
    bridgeCopy:
      "Each architecture review is tracked as one review package — the same object from capture through signed manifest and export.",
    primaryAction: { label: "Start new review", href: "/reviews/new" },
    operateDeferralNote:
      "Graph, Compare, and heavy governance surfaces stay out of the sidebar until after your first committed package.",
  },
  onboarding: {
    useWhen: "You want a guided checklist before opening the full product.",
    bridgeCopy:
      "The checklist below walks one architecture review from capture to committed signed manifest.",
    primaryAction: { label: "Open new review wizard", href: "/reviews/new" },
    operateDeferralNote: "Finish this four-step path before exploring Operate analysis or governance lanes.",
  },
  "new-review": {
    useWhen: "You are ready to describe a system and start the review.",
    bridgeCopy:
      "Submitting here creates one architecture review package — you will return to review detail to finalize and export.",
    primaryAction: { label: "Continue in wizard below", href: "#new-review-wizard" },
    operateDeferralNote: "Policy packs and governance depth can wait until after your first committed package unless your pilot requires them.",
  },
  "reviews-list": {
    useWhen: "You want to resume an in-progress review or open a committed review package.",
    bridgeCopy:
      "The list shows every review package in this workspace — each with its own signed manifest and exports.",
    primaryAction: { label: "Start new review", href: "/reviews/new" },
    operateDeferralNote: "Compare is optional — not required for first-pilot success.",
  },
  "review-detail-in-progress": {
    useWhen: "The review is running or findings are ready but the signed manifest is not finalized yet.",
    bridgeCopy:
      "Stay on this page until you finalize — that locks the signed decision record and unlocks sponsor exports.",
    primaryAction: { label: "Go to finalize actions", href: "#run-actions" },
    operateDeferralNote: "Skip graph and governance dashboards until after commit unless your pilot explicitly needs them.",
  },
  "review-detail-committed": {
    useWhen: "The manifest is committed and you need sponsor-ready exports or an executive summary.",
    bridgeCopy:
      "This review package is complete — downloads and executive summary live on this page before you explore Operate.",
    primaryAction: { label: "Open exports section", href: "#artifacts-exports" },
    operateDeferralNote: "Operate surfaces unlock in the sidebar after your first committed review when you need compare, graph, or digests.",
  },
};

export function resolveFirstWeekRouteGuidance(
  variant: FirstWeekRouteGuidanceVariant,
): FirstWeekRouteGuidanceConfig {
  return FIRST_WEEK_ROUTE_GUIDANCE[variant];
}
