export const FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY = "Recommended first session path";

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
  /** Omitted when the page already surfaces the next step (e.g. wizard visible on `/reviews/new`). */
  readonly primaryAction?: FirstWeekRouteGuidanceAction;
  readonly operateDeferralNote: string;
};

/** Buyer-polished shell renders finalize in the page header — anchor must match {@link RunDetailPageHeader} (BDA-001). */
export const BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR = "#finalize-review";

const BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE: FirstWeekRouteGuidanceConfig = {
  useWhen: "The review is running or findings are ready but the signed review record is not finalized yet.",
  bridgeCopy:
    "Stay on this page until you finalize — that locks the signed decision record and unlocks sponsor exports.",
  primaryAction: { label: "Finalize this review", href: BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR },
  operateDeferralNote: "Skip graph and governance dashboards until after commit unless your pilot explicitly needs them.",
};

export const FIRST_WEEK_ROUTE_GUIDANCE: Record<FirstWeekRouteGuidanceVariant, FirstWeekRouteGuidanceConfig> = {
  home: {
    useWhen: "You are in your first pilot session and need the shortest path to a committed review package.",
    bridgeCopy:
      "Each architecture review is tracked as one review package — the same object from capture through signed review record and export. Start with briefs, diagrams, or IaC only (evidence-only); Azure extractor ZIP is optional when you need live topology or cost grounding.",
    primaryAction: { label: "Start new review", href: "/reviews/new" },
    operateDeferralNote:
      "Graph, Compare, and heavy governance surfaces stay out of the sidebar until after your first committed package.",
  },
  onboarding: {
    useWhen: "Follow this guided path to create and commit your first review package.",
    bridgeCopy:
      "The checklist below walks one architecture review from capture to committed signed review record.",
    primaryAction: { label: "Start review", href: "/reviews/new" },
    operateDeferralNote: "Finish this path before exploring Operate analysis or governance lanes.",
  },
  "new-review": {
    useWhen: "You have enough context to start an architecture review.",
    bridgeCopy:
      "ArchLucid produces a defensible review package — committed findings, evidence trail, and sponsor-ready exports. Default to evidence-only (no cloud target) unless you attach Azure extractor output.",
    operateDeferralNote:
      "Policy packs and deeper governance can wait until after your first committed package. Azure extractor ZIP is optional — see the InfoSec pre-read if security must approve the script.",
  },
  "reviews-list": {
    useWhen: "You want to resume an in-progress review or open a committed review package.",
    bridgeCopy:
      "Each package gives you the review record, findings, evidence trail, signed review record, and exports.",
    operateDeferralNote: "",
  },
  "review-detail-in-progress": BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE,
  "review-detail-committed": {
    useWhen: "The review package is finalized and you need sponsor-ready exports or an executive summary.",
    bridgeCopy:
      "This review package is complete — downloads and executive summary live on this page before you explore Operate. Use 'Copy for AI assistant' in the exports section to paste findings into Claude, GPT, or Gemini.",
    primaryAction: { label: "Open exports section", href: "#artifacts-exports" },
    operateDeferralNote: "Operate surfaces unlock in the sidebar after your first committed review when you need compare, graph, or digests.",
  },
};

export function resolveFirstWeekRouteGuidance(
  variant: FirstWeekRouteGuidanceVariant,
): FirstWeekRouteGuidanceConfig {
  return FIRST_WEEK_ROUTE_GUIDANCE[variant];
}

export function resolveFirstWeekRouteGuidanceForShell(
  variant: FirstWeekRouteGuidanceVariant,
  buyerPolishedShell: boolean,
): FirstWeekRouteGuidanceConfig {
  if (buyerPolishedShell && variant === "review-detail-in-progress") {
    return BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE;
  }

  return resolveFirstWeekRouteGuidance(variant);
}
