import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import {
  BILLING_AND_PLANS_HELP_PATH,
  SETTINGS_BILLING_PATH,
} from "@/lib/billing-and-plans-help-route";
import { OPERATOR_BILLING_PUBLIC_PRICING_LINK_LABEL } from "@/lib/marketing/marketing-public-pricing";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";

export const BILLING_HELP_CANONICAL_PATH = BILLING_AND_PLANS_HELP_PATH;

export const BILLING_HELP_PAGE_TITLE = "Billing and plans";

/** Disambiguates the help topic from Administration → Billing and plans. */
export const BILLING_HELP_PAGE_DISPLAY_TITLE = "Billing and plans — help topic";

export const BILLING_HELP_PAGE_SUBTITLE =
  "Manage your ArchLucid subscription, payment method, invoices, seats, and usage from Billing and plans.";

export const BILLING_HELP_PAGE_SUBTITLE_BUYER =
  "Manage subscription, seats, and billing from workspace settings.";

export const BILLING_HELP_PAGE_SUBTITLE_OPERATOR = BILLING_HELP_PAGE_SUBTITLE;

export function billingHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? BILLING_HELP_PAGE_SUBTITLE_BUYER : BILLING_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const BILLING_HELP_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const BILLING_HELP_ACTION_REFRESH = "Refresh" as const;

export const BILLING_HELP_ACTION_REFRESHING = "Refreshing…" as const;

export const BILLING_HELP_SCOPE_DETAILS_TRIGGER = "About billing and plans" as const;

export const BILLING_HELP_OVERVIEW =
  "ArchLucid billing is managed from your workspace settings. Compare public plans on the pricing page, then complete purchase or ongoing subscription changes from Billing and plans.";

export const BILLING_HELP_PRIMARY_ACTIONS = {
  manageBilling: {
    label: "Open Billing and plans",
    href: SETTINGS_BILLING_PATH,
  },
  viewPricing: {
    label: OPERATOR_BILLING_PUBLIC_PRICING_LINK_LABEL,
    href: "/pricing",
    publicPageHint: "Public page",
  },
} as const;

export const BILLING_HELP_NO_PERMISSION_HINT =
  "Billing changes require workspace administrator access. Contact your workspace billing administrator or workspace owner.";

export const BILLING_HELP_HOW_BILLING_WORKS_ITEMS = [
  {
    id: "trial",
    title: "Trial",
    body: "New workspaces can start on a trial. When the trial ends, choose a paid plan from Billing and plans to continue.",
  },
  {
    id: "subscription",
    title: "Subscription",
    body: "Paid plans activate after checkout. Your subscription status and renewal details appear in Billing and plans.",
  },
  {
    id: "seats",
    title: "Seats",
    body: "Plans include workspace seats for your team. Seat usage and add-ons are managed from Billing and plans.",
  },
  {
    id: "ai-usage",
    title: "AI usage",
    body: "Monthly AI usage is shown in Billing and plans and AI usage settings. Prepaid credits can supplement included allowance on paid plans.",
  },
  {
    id: "changes",
    title: "Plan changes and cancellation",
    body: "Workspace administrators can update payment details, change plans, or cancel from Billing and plans.",
  },
] as const;

export type BillingHelpFaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export const BILLING_HELP_FAQ_ITEMS: readonly BillingHelpFaqItem[] = [
  {
    id: "trial-ends",
    question: "What happens when my trial ends?",
    answer:
      "Your workspace prompts you to choose a paid plan. Open Billing and plans to compare options and complete checkout. If you need more time, contact billing support.",
  },
  {
    id: "who-manages",
    question: "Who can manage billing?",
    answer:
      "Workspace administrators can manage payment methods, subscriptions, and plan changes. Other members can view Billing and plans but cannot complete billing actions.",
  },
  {
    id: "payment-method",
    question: "How do I update the payment method?",
    answer:
      "Open Billing and plans and choose Manage billing. You can add or update your payment method from the secure billing session.",
  },
  {
    id: "invoices",
    question: "Where can I find invoices?",
    answer:
      "Open Billing and plans and choose Manage billing. Invoice history is available from the secure billing session.",
  },
  {
    id: "seats",
    question: "How do seats work?",
    answer:
      "Each plan includes a number of workspace seats. Seat usage appears in Billing and plans. Add seats when your team outgrows the included allowance.",
  },
  {
    id: "ai-usage",
    question: "How is AI usage handled?",
    answer:
      "Billing and plans shows your monthly AI usage summary. Open AI usage settings for detailed reporting and prepaid credit options.",
  },
  {
    id: "change-cancel",
    question: "Can I change or cancel my plan?",
    answer:
      "Workspace administrators can change plans or cancel from Billing and plans. For enterprise or procurement arrangements, contact billing support.",
  },
  {
    id: "billing-help",
    question: "How do I get billing help?",
    answer:
      "Start in Billing and plans for self-serve actions. If you are blocked, email billing support with your workspace name and a short description of the issue.",
  },
] as const;

export const BILLING_HELP_SUPPORT_INTRO =
  "For billing questions that cannot be resolved from Billing and plans, contact ArchLucid support.";

export const BILLING_HELP_SUPPORT_ACTION = {
  label: "Contact billing support",
  href: `mailto:${ARCHLUCID_SUPPORT_EMAIL}?subject=Billing%20support`,
} as const;

export const BILLING_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "how-billing-works", title: "How billing works" },
  { level: 2, id: "common-questions", title: "Common questions" },
  { level: 2, id: "support", title: "Support" },
];
