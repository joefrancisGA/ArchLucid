import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_VALUE_20_HELP_PATH } from "@/lib/first-value-20-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const FIRST_VALUE_20_HELP_PAGE_TITLE = "First value in 20 minutes (Admin runbook)";

export const FIRST_VALUE_20_HELP_PAGE_SUBTITLE =
  "Admin/SE time-boxed checklist when platform wiring is already green. Not the default customer help path.";

export const FIRST_VALUE_20_HELP_OVERVIEW =
  "Use this runbook only when you are an Admin or SE collecting a sponsor-safe artifact in about 20 minutes. Customer architects should stay on Your first architecture review. Label simulator outputs honestly unless real-mode LLM evidence was collected.";

export const FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE =
  "A completed 20-minute path produces architecture-review evidence for SE demos — not certification. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const FIRST_VALUE_20_HELP_ORIENTATION = [
  "Confirm API health and persistence before starting the time box.",
  "Create, execute, and finalize one architecture review (UI checklist or CLI).",
  "Collect the proof packet and review sponsor first-page status before handoff.",
] as const;

/** Explicit job split vs other “first” help URLs (TB-1694). */
export const FIRST_VALUE_20_HELP_JOB_MATRIX = [
  {
    label: "Customer first review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    when: "Default path for customer architects",
  },
  {
    label: "Your first architecture review",
    href: inAppHelpHref("first-architecture-review"),
    when: "End-to-end lifecycle without the Admin time box",
  },
  {
    label: "First-run evidence checklist",
    href: inAppHelpHref("first-review"),
    when: "Printable SE Tier-1 extractor / finalize checklist",
  },
  {
    label: "This Admin 20-minute runbook",
    href: FIRST_VALUE_20_HELP_PATH,
    when: "Time-boxed SE proof when wiring is already green",
  },
] as const;

export const FIRST_VALUE_20_HELP_PRIMARY_ACTIONS = {
  openBuyerFirstReview: {
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
  },
  startArchitectureReview: {
    label: "Start architecture review",
    href: "/architecture/reviews/new",
  },
  openTroubleshooting: {
    label: "Customer Troubleshooting",
    href: inAppHelpHref("troubleshooting"),
  },
} as const;

export type FirstValue20HelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Admin Sources — no self-href to this topic. */
export const FIRST_VALUE_20_HELP_SOURCES: readonly FirstValue20HelpSourceLink[] = [
  { label: "Your first architecture review", href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "First-run evidence checklist", href: inAppHelpHref("first-review") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Configuration reference", href: inAppHelpHref("configuration-reference") },
  { label: "Specialty walkthroughs", href: inAppHelpHref("specialty-walkthroughs") },
] as const;

export const FIRST_VALUE_20_HELP_CANONICAL_PATH = FIRST_VALUE_20_HELP_PATH;
