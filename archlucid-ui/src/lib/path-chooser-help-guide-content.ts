import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PATH_CHOOSER_HELP_PAGE_TITLE = "Choose your next step";

export const PATH_CHOOSER_HELP_PAGE_SUBTITLE =
  "Map your current goal — evaluate, pilot, procurement, sponsor output, or engineering support — to one primary next action.";

export const PATH_CHOOSER_HELP_OVERVIEW =
  "Pick the branch that matches your goal, open the primary product or help surface, and use Sources before treating orientation copy as diligence evidence.";

export const PATH_CHOOSER_HELP_CLAIM_DISCIPLINE =
  "Trust Center and Assurance status remain the sponsor-safe diligence cites.";

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
    fallback: { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
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
    goal: "I need sponsor or executive output",
    primary: {
      label: "Executive summary expectations",
      href: inAppHelpHref("executive-summary"),
    },
    fallback: { label: "Reviews hub", href: "/architecture/reviews" },
  },
  {
    id: "engineering",
    goal: "I need engineering or CLI support",
    primary: { label: "CLI usage", href: inAppHelpHref("cli-usage") },
    fallback: {
      label: "Configuration reference",
      href: inAppHelpHref("configuration-reference"),
    },
  },
] as const;

export type PathChooserHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Sponsor-safe Sources — no self-href to this topic. */
export const PATH_CHOOSER_HELP_SOURCES: readonly PathChooserHelpSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Trust Center", href: "/trust" },
  { label: "Procurement FAQ", href: inAppHelpHref("procurement") },
  {
    label: "Data handling and tenant isolation",
    href: inAppHelpHref("data-handling"),
  },
  { label: "Executive summary", href: inAppHelpHref("executive-summary") },
] as const;

export const PATH_CHOOSER_HELP_CANONICAL_PATH = PATH_CHOOSER_HELP_PATH;
