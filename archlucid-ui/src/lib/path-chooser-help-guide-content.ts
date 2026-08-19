import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PATH_CHOOSER_HELP_BREADCRUMB_TOPIC_TITLE = "Choose your next step";

export const PATH_CHOOSER_HELP_PAGE_EYEBROW = "Help topic" as const;

export const PATH_CHOOSER_HELP_PAGE_TITLE = "Choose your next step";

export const PATH_CHOOSER_HELP_PAGE_SUBTITLE =
  "Map your current goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary next action.";

export const PATH_CHOOSER_HELP_PAGE_SUBTITLE_BUYER =
  "Match your evaluation goal to one primary product or help surface before sponsor or procurement handoff." as const;

export const PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID = "help-path-chooser-primary-content" as const;

export const PATH_CHOOSER_HELP_SKIP_LINK_LABEL = "Skip to path chooser guide" as const;

export function pathChooserHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? PATH_CHOOSER_HELP_PAGE_SUBTITLE_BUYER : PATH_CHOOSER_HELP_PAGE_SUBTITLE;
}

export const PATH_CHOOSER_HELP_OVERVIEW =
  "Pick the branch that matches your goal, open the primary product or help surface, and use Trust Center or Assurance status before treating orientation copy as diligence evidence.";

export const PATH_CHOOSER_HELP_ACTION_PANEL_TITLE = "Common next steps";

export const PATH_CHOOSER_HELP_ACTION_PANEL_INTRO =
  "When you already know your goal, start here — otherwise use the evaluator session steps or Choose by goal below for primary and alternate routes.";

export type PathChooserHelpEvaluatorSessionStep = {
  readonly title: string;
  readonly body: string;
  readonly action: { readonly label: string; readonly href: string };
};

/** Four-step evaluator session flow — absorbs former evaluator-workbook topic chrome (TB-1345 / TB-1348). */
export const PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS: readonly PathChooserHelpEvaluatorSessionStep[] = [
  {
    title: "Read sponsor report expectations",
    body: "Understand the outcome story before you run a review or brief sponsors.",
    action: { label: "Sponsor report", href: inAppHelpHref("sponsor-report") },
  },
  {
    title: "Start an architecture review",
    body: "Run or observe one governed review on your evidence or an accepted demo workspace.",
    action: { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new" },
  },
  {
    title: "Follow your first architecture review guide",
    body: "Use the step-by-step path when you need help mid-session.",
    action: {
      label: "Your first architecture review",
      href: inAppHelpHref("first-architecture-review"),
    },
  },
  {
    title: "Read pass / hold interpretation",
    body: "Interpret proof disposition labels before external circulation.",
    action: {
      label: "Pass / hold interpretation",
      href: "#pass-hold-deferred-interpretation",
    },
  },
] as const;

export const PATH_CHOOSER_HELP_PRIMARY_ACTIONS = {
  startReview: {
    label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
    href: "/architecture/reviews/new",
  },
  securityTrust: {
    label: "Security and trust",
    href: inAppHelpHref("security-trust"),
  },
  firstPilotPath: {
    label: "Your first architecture review",
    href: inAppHelpHref("first-architecture-review"),
  },
} as const;

export type PathChooserHelpBranch = {
  readonly id: string;
  readonly goal: string;
  readonly primary: { readonly label: string; readonly href: string };
  readonly fallback: { readonly label: string; readonly href: string };
};

/** Goal → primary/fallback product surfaces — in-app cites only (TB-1713). */
export const PATH_CHOOSER_HELP_BRANCHES: readonly PathChooserHelpBranch[] = [
  {
    id: "evaluate",
    goal: "I want to evaluate ArchLucid",
    primary: {
      label: BUYER_START_ARCHITECTURE_REVIEW_CTA,
      href: "/architecture/reviews/new",
    },
    fallback: {
      label: "Your first architecture review",
      href: inAppHelpHref("first-architecture-review"),
    },
  },
  {
    id: "stuck",
    goal: "I am stuck mid-pilot",
    primary: {
      label: "Your first architecture review",
      href: inAppHelpHref("first-architecture-review"),
    },
    fallback: { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  },
  {
    id: "procurement",
    goal: "I need procurement or security evidence",
    primary: {
      label: "Security and trust",
      href: inAppHelpHref("security-trust"),
    },
    fallback: {
      label: "Data handling and tenant isolation",
      href: inAppHelpHref("data-handling"),
    },
  },
  {
    id: "sponsor",
    goal: "I need sponsor or sponsor output",
    primary: {
      label: "Sponsor report expectations",
      href: inAppHelpHref("sponsor-report"),
    },
    fallback: { label: "Reviews hub", href: "/architecture/reviews" },
  },
  {
    id: "engineering",
    goal: "I need engineering or CLI support",
    primary: { label: "CLI usage", href: inAppHelpHref("cli-usage") },
    fallback: { label: "Customer Troubleshooting", href: inAppHelpHref("troubleshooting") },
  },
] as const;

export const PATH_CHOOSER_HELP_CANONICAL_PATH = PATH_CHOOSER_HELP_PATH;
