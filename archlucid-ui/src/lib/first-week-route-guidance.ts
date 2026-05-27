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
      "Each architecture review is tracked as one run in the product — the same object from capture through export.",
    primaryAction: { label: "Start new review", href: "/reviews/new" },
    operateDeferralNote:
      "Graph, Compare, Replay, and heavy governance surfaces stay out of the sidebar until after your first committed package.",
  },
  onboarding: {
    useWhen: "You want a guided checklist before opening the full operator shell.",
    bridgeCopy:
      "The checklist below walks one architecture review from capture to committed manifest; APIs and support still refer to it as a run.",
    primaryAction: { label: "Open new review wizard", href: "/reviews/new" },
    operateDeferralNote: "Finish this four-step path before exploring Operate analysis or governance lanes.",
  },
  "new-review": {
    useWhen: "You are ready to describe a system and start pipeline execution.",
    bridgeCopy:
      "Submitting here creates one architecture review (one run) — you will return to review detail to execute, finalize, and export.",
    primaryAction: { label: "Continue in wizard below", href: "#new-review-wizard" },
    operateDeferralNote: "Policy packs and governance depth can wait until after your first committed package unless your pilot requires them.",
  },
  "reviews-list": {
    useWhen: "You want to resume an in-progress review or open a committed review package.",
    bridgeCopy:
      "The list shows every architecture review in this workspace; each row is one run with its own manifest and exports.",
    primaryAction: { label: "Start new review", href: "/reviews/new" },
    operateDeferralNote: "Compare and Replay are optional — not required for first-pilot success.",
  },
  "review-detail-in-progress": {
    useWhen: "The pipeline is running or findings are ready but the manifest is not finalized yet.",
    bridgeCopy:
      "Stay on this page until you finalize — that locks the reviewed manifest and unlocks sponsor exports.",
    primaryAction: { label: "Go to finalize actions", href: "#run-actions" },
    operateDeferralNote: "Skip graph, replay, and governance dashboards until after commit unless your pilot explicitly needs them.",
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
