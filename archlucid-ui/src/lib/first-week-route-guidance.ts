import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";

export const FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY = "Recommended first session path";

export const FIRST_WEEK_ROUTE_GUIDANCE_HOME_COLLAPSED_SUMMARY =
  "Suggested sequence for getting from first artifact to a finalized review.";

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
  /** Omitted when the page already surfaces the next step (e.g. wizard visible on `/architecture/reviews/new`). */
  readonly primaryAction?: FirstWeekRouteGuidanceAction;
  readonly operateDeferralNote: string;
};

/** Buyer-polished shell renders finalize in the page header — anchor must match {@link RunDetailPageHeader} (BDA-001). */
export const BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR = "#finalize-review";

const BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE: FirstWeekRouteGuidanceConfig = {
  useWhen: "The review is running or findings are ready but the sealed review record is not finalized yet.",
  bridgeCopy:
    "Stay on this page until you finalize — that locks the sealed review record and unlocks sponsor exports.",
  // Primary CTA lives in ReviewPackageDoThisNextStrip above this callout.
  operateDeferralNote: "Skip graph and governance dashboards until after commit unless your pilot explicitly needs them.",
};

export const FIRST_WEEK_ROUTE_GUIDANCE_REVIEW_DETAIL_COMMITTED_COLLAPSED_SUMMARY =
  "When to use a finalized review and where exports live.";

export const FIRST_WEEK_ROUTE_GUIDANCE: Record<FirstWeekRouteGuidanceVariant, FirstWeekRouteGuidanceConfig> = {
  home: {
    useWhen: "You are in your first pilot session and need the shortest path to a committed review.",
    bridgeCopy:
      "Each architecture review is tracked as one review — the same object from capture through sealed review record and export. Start with briefs, diagrams, or IaC only (evidence-only); cloud inventory ZIP (AWS, Azure, or GCP) is optional when you need live architecture structure or cost grounding.",
    primaryAction: { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH },
    operateDeferralNote:
      "Graph, Compare, and heavy governance surfaces stay out of the sidebar until after your first committed package.",
  },
  onboarding: {
    useWhen: "Follow this guided path to create and commit your first review.",
    bridgeCopy:
      "The checklist below walks one architecture review from capture to committed sealed review record.",
    primaryAction: { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH },
    operateDeferralNote: "Finish this path before exploring Operate analysis or governance lanes.",
  },
  "new-review": {
    useWhen: "You have enough context to start an architecture review.",
    bridgeCopy:
      "ArchLucid produces a defensible review — committed findings, evidence trail, and sponsor-ready exports. Default to evidence-only (no cloud target) unless you attach cloud inventory output.",
    operateDeferralNote:
      "Policy packs and deeper governance can wait until after your first committed package. Cloud inventory ZIP is optional — see the InfoSec pre-read if security must approve the read-only script.",
  },
  "reviews-list": {
    useWhen: "You want to resume an in-progress review or open a committed review.",
    bridgeCopy:
      "Each package gives you the review record, findings, evidence trail, sealed review record, and exports.",
    operateDeferralNote: "",
  },
  "review-detail-in-progress": BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE,
  "review-detail-committed": {
    useWhen: "The review is finalized and you need sponsor-ready exports or a board summary.",
    bridgeCopy:
      "This review is complete — use the exports section in Review when you need deliverables for sponsors or auditors.",
    // Primary CTA lives in ReviewPackageDoThisNextStrip above this callout.
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
