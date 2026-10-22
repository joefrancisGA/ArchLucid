import type { LucideIcon } from "lucide-react";
import { Building2, Cloud, Flag, HeartPulse, Landmark, ShoppingCart } from "lucide-react";

import {
  CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN,
  CUSTOMER_AUTH_PUBLIC_SAMPLE_NO_SIGN_IN,
} from "@/lib/auth/customer-auth-messaging";
import { publicSampleHrefForGetStartedVertical } from "@/lib/samples/sample-scenario-surface-alignment";

import type { BuyerGetStartedVerticalSlug } from "./get-started-verticals";

export const GET_STARTED_PAGE_TITLE = "See what ArchLucid can do in 30 minutes";

export const GET_STARTED_LAST_REVIEWED_LABEL = "2026-08-15" as const;

export const GET_STARTED_PRIMARY_CONTENT_ID = "get-started-primary-content" as const;

export const GET_STARTED_HERO_LEAD =
  "Explore an illustrative review immediately, or sign in to create a guided sample review in your own workspace. No local installation or credit card is required.";

export const GET_STARTED_OUTCOME_STATEMENT =
  "By the end of the guided experience, you will have explored a review containing findings, supporting evidence, an audit trail, and an export-ready summary.";

export const GET_STARTED_SAMPLE_PATH_NOTE =
  "The instant sample opens a completed illustrative review. Industry-specific profiles apply when you start the guided trial in your workspace. Healthcare uses the regulated-depth Claims sample; other verticals use the generic enterprise intake sample.";

export const GET_STARTED_SAMPLE_DISCLOSURE =
  "The guided review uses illustrative architecture inputs and demo-labeled records. It demonstrates the workflow and output but is not an assessment of your organization's architecture.";

export const GET_STARTED_REAL_REVIEW_NOTE =
  "To evaluate ArchLucid with your own architecture, start a guided evaluation and provide the requirements, diagrams, evidence, and policy context appropriate to your review.";

export type GetStartedPathId = "sample" | "trial";

export type GetStartedMilestone = {
  readonly n: number;
  readonly title: string;
  readonly estimate: string;
  readonly body: string;
  readonly outcome: string;
};

export const GET_STARTED_PUBLIC_SAMPLE_SIGN_IN_NOTE = CUSTOMER_AUTH_PUBLIC_SAMPLE_NO_SIGN_IN;

export const GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE = CUSTOMER_AUTH_GUIDED_WORKSPACE_SIGN_IN;

/** @deprecated Prefer {@link GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE}. */
export const GET_STARTED_WORK_IDENTITY_SIGN_IN_NOTE = GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE;

export const GET_STARTED_MILESTONES: readonly GetStartedMilestone[] = [
  {
    n: 1,
    title: "Sign in and open your workspace",
    estimate: "2–3 minutes",
    body: `${GET_STARTED_GUIDED_WORKSPACE_SIGN_IN_NOTE} ArchLucid creates or opens your workspace without requiring a credit card.`,
    outcome: "You land in a workspace ready for your first guided sample review.",
  },
  {
    n: 2,
    title: "Choose an industry profile",
    estimate: "2 minutes",
    body: "Select the profile closest to your review. It supplies relevant terminology, policies, and analysis priorities, and can be changed later.",
    outcome: "Defaults are applied to your sample review — you are not locked into the profile.",
  },
  {
    n: 3,
    title: "Run the guided sample review",
    estimate: "10–15 minutes",
    body: "ArchLucid prepares an illustrative architecture scenario for the selected industry and guides you through the first review. Sample inputs are prepopulated.",
    outcome: "After the sample review completes, you can inspect findings, evidence links, and the review record.",
  },
  {
    n: 4,
    title: "Inspect the result and choose a next step",
    estimate: "10 minutes",
    body: "Review the conclusion, findings, evidence links, audit history, and sponsor report. Then run another sample, invite a colleague, or begin an evaluation using your own material.",
    outcome: "You understand what ArchLucid produces and which next step fits your evaluation.",
  },
] as const;

export const GET_STARTED_REVIEW_OUTPUTS = [
  {
    title: "Review conclusion",
    description: "A plain-language recommendation and overall assessment.",
  },
  {
    title: "Findings",
    description: "Observed conditions that may require action, monitoring, or acceptance.",
  },
  {
    title: "Supporting evidence",
    description: "Traceable sources and citations supporting review conclusions.",
  },
  {
    title: "Audit history",
    description: "A record of significant review and approval actions.",
  },
  {
    title: "Sponsor report",
    description: "A concise explanation suitable for decision-makers.",
  },
] as const;

export type GetStartedVerticalPresentation = {
  readonly slug: BuyerGetStartedVerticalSlug;
  readonly label: string;
  readonly scenario: string;
  readonly icon: LucideIcon;
  readonly publicSampleHref: string;
  readonly publicSampleAccessibleName: string;
};

export const GET_STARTED_VERTICAL_PRESENTATIONS: readonly GetStartedVerticalPresentation[] = [
  {
    slug: "financial-services",
    label: "Financial services",
    scenario: "Digital account-opening modernization",
    icon: Building2,
    // TB-981: generic enterprise intake is the default anonymous proof; healthcare keeps Claims secondary.
    publicSampleHref: publicSampleHrefForGetStartedVertical("financial-services"),
    publicSampleAccessibleName: "Open illustrative financial services sample review",
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    scenario: "Claims intake modernization",
    icon: HeartPulse,
    publicSampleHref: publicSampleHrefForGetStartedVertical("healthcare"),
    publicSampleAccessibleName: "Open healthcare claims illustrative sample review",
  },
  {
    slug: "retail",
    label: "Retail",
    scenario: "Omnichannel order-management modernization",
    icon: ShoppingCart,
    publicSampleHref: publicSampleHrefForGetStartedVertical("retail"),
    publicSampleAccessibleName: "Open illustrative retail sample review",
  },
  {
    slug: "saas",
    label: "SaaS",
    scenario: "Enterprise platform scaling review",
    icon: Cloud,
    publicSampleHref: publicSampleHrefForGetStartedVertical("saas"),
    publicSampleAccessibleName: "Open illustrative SaaS sample review",
  },
  {
    slug: "public-sector",
    label: "Public sector",
    scenario: "Digital service modernization",
    icon: Landmark,
    publicSampleHref: publicSampleHrefForGetStartedVertical("public-sector"),
    publicSampleAccessibleName: "Open illustrative public sector sample review",
  },
  {
    slug: "public-sector-us",
    label: "US government",
    scenario: "Government workload and control review",
    icon: Flag,
    publicSampleHref: publicSampleHrefForGetStartedVertical("public-sector-us"),
    publicSampleAccessibleName: "Open illustrative US government sample review",
  },
] as const;

export const GET_STARTED_HELP_GETTING_STARTED_HREF = "/help/getting-started" as const;

export const GET_STARTED_TRIAL_PATH_SCROLL_LABEL = "View trial milestones" as const;

export const GET_STARTED_EVALUATION_SIGNUP_LABEL = "Start evaluation signup" as const;

export function buildGuidedTrialHref(verticalSlug?: BuyerGetStartedVerticalSlug): string {
  const params = new URLSearchParams({ source: "get-started" });

  if (verticalSlug !== undefined) {
    params.set("vertical", verticalSlug);
  }

  return `/architecture/first-review-guide?${params.toString()}`;
}

export function buildSignInTrialHref(verticalSlug?: BuyerGetStartedVerticalSlug): string {
  const onboardingPath =
    verticalSlug === undefined
      ? "/architecture/first-review-guide?source=get-started"
      : `/architecture/first-review-guide?source=get-started&vertical=${encodeURIComponent(verticalSlug)}`;

  return `/auth/signin?returnUrl=${encodeURIComponent(onboardingPath)}`;
}
