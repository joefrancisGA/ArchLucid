import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import {
  MODE_GRAVITY_GUIDED_GRAVITY_ONE_SENTENCE,
  MODE_GRAVITY_WORKING_GRAVITY_ONE_SENTENCE,
  MODE_GRAVITY_WORKING_GRAVITY_REHEARSAL_EXCEPTION,
} from "@/lib/mode-gravity-working-gravity-one-sentence";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** MG-012 — help: which mode am I in. */
export const MODE_GRAVITY_HELP_WHICH_MODE_SLUG = "which-mode-am-i-in" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_TITLE = "Which mode am I in?" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_TOPIC_LABEL = "Which mode am I in?" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_PAGE_SUBTITLE =
  "Workspace mode, execute gravity, and eval builds on Working vs Guided." as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_DISCIPLINE =
  "Demo, trial, and Guided chrome teach eval posture — they are not unlabeled Working Record days." as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_HEADING_ID = "help-which-mode-claim-discipline" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_OVERVIEW =
  "Start with workspace mode: Working is your all-day instrument; Guided is eval teaching. On Working, Record means sealed-record proof and Practice means labeled dry-run. Demo and trial builds use eval chrome — they are not Working Record days." as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_WORKING =
  MODE_GRAVITY_WORKING_GRAVITY_ONE_SENTENCE;

export const MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_GUIDED =
  MODE_GRAVITY_GUIDED_GRAVITY_ONE_SENTENCE;

export const MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_DEMO =
  "Demo, static showcase, and frictionless trial builds use eval chrome. They teach Simulator — they are not unlabeled Working Career days." as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_APPLICABILITY_SECURENOW =
  "SecureNow (Security) is a production security shell without ArchLucid Training or Customer Intake Demo banners — workspace mode labels still apply to cross-product help." as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_RECORD_PRACTICE_BODY =
  `${MODE_GRAVITY_WORKING_GRAVITY_REHEARSAL_EXCEPTION} Record vs Practice is the execute-gravity control on Working — separate from workspace density (Guided vs Working).` as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY_HEADING = "When mode labels look wrong" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY = {
  whatFailed: "Shell chrome shows a mode or review-type label that does not match your intent (Working vs Guided, Record vs Practice).",
  whatIsIntact: "Committed reviews and workspace membership are unchanged — mode confusion is a navigation/readiness issue, not silent data loss.",
  nextStep: "Check workspace scope, honesty banners, and the review-type chooser; open Workspace settings or this guide before retrying execute.",
} as const;

export type ModeGravityHelpWhichModeRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING_ID = "help-which-mode-related-topics" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING = "Related" as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_RELATED_LINKS: readonly ModeGravityHelpWhichModeRelatedLink[] = [
  { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
  { label: "Your workspace after sign-in", href: inAppHelpHref("first-login-workspace") },
  { label: "System gravity", href: inAppHelpHref("system-gravity") },
  { label: "Workspace and scope", href: inAppHelpHref("scope") },
] as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: MODE_GRAVITY_HELP_WHICH_MODE_CLAIM_HEADING_ID, title: "Eval chrome is not Working Record" },
  { level: 2, id: "help-which-mode-working-heading", title: "Working" },
  { level: 2, id: "help-which-mode-guided-heading", title: "Guided" },
  { level: 2, id: "help-which-mode-eval-heading", title: "Demo and trial" },
  { level: 2, id: "help-which-mode-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-which-mode-record-practice", title: "Record vs Practice" },
  { level: 2, id: "help-which-mode-error-recovery", title: MODE_GRAVITY_HELP_WHICH_MODE_ERROR_RECOVERY_HEADING },
  { level: 2, id: MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING_ID, title: MODE_GRAVITY_HELP_WHICH_MODE_RELATED_TOPICS_HEADING },
] as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_CANONICAL_PATH = MODE_GRAVITY_HELP_WHICH_MODE_PATH;

/** Customer chart excludes operator-experience engineering flag (ADR 0094). */
export const MODE_GRAVITY_HELP_WHICH_MODE_EXCLUDED_FROM_CHART = [
  "NEXT_PUBLIC_OPERATOR_EXPERIENCE",
  "operator-experience",
] as const;

export const MODE_GRAVITY_HELP_WHICH_MODE_ALIASES = [
  "which mode",
  "am i in working",
  "guided or working",
  "career or rehearsal",
  "eval chrome",
  "demo mode",
] as const;
