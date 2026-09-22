import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { FIRST_LOGIN_WORKSPACE_HELP_PATH } from "@/lib/first-login-workspace-help-route";

/** LS-015 — help: your workspace after sign-in. */
export const FIRST_LOGIN_WORKSPACE_HELP_SLUG = "first-login-workspace" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_TITLE = "Your workspace after sign-in" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_TOPIC_LABEL = "First login workspace" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_PAGE_SUBTITLE =
  "Live tenant workspace, Training on sample data, and Record vs Practice after sign-in." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_CLAIM_DISCIPLINE =
  "Training and Customer Intake Demo are evaluation scope — not sealed-record proof or live tenant authority." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_CLAIM_HEADING_ID = "help-first-login-workspace-claim-discipline" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_OVERVIEW =
  "After sign-in, ArchLucid opens your live tenant workspace by default. Training is an optional walkthrough on sample data — it is not the same control as Record or Practice." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_INVITE_SECTION =
  "If an admin invited you, you join the workspace they assigned. You land on that live workspace — not the Customer Intake Demo sample — unless you explicitly choose Training on first login." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_CREATE_SECTION =
  "If you have no workspace membership yet, post-auth setup helps you create or request access. Training does not replace that step." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_FIRST_CHOICE_SECTION =
  "On your first signed-in session, you may see two choices: Start in my workspace (your tenant scope) or Training (Guided mode on the sample workspace). Either choice is saved so you are not asked again." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_RECORD_VS_TRAINING_SECTION =
  "Record and Practice are review-type controls on your live workspace. Training is workspace scope on sample data. Selecting Record while you are still on the sample workspace does not make the data live — check the workspace label and honesty banners." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_NOT_LIVE_SECTION =
  "If you see NOT LIVE DATA or Customer Intake Demo in the header, you are on the sample workspace. Use Back to your workspace in the banner or scope switcher, or finish Training and leave when you are ready." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_WORKING =
  "Working Architecture seats open your live tenant workspace by default. Record and Practice review-type controls apply on architecture packages — check the workspace label before you treat findings as sponsor proof." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may show first-run Training choices and NOT LIVE DATA banners on the sample workspace. That teaching chrome does not rewrite live tenant membership." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_APPLICABILITY_SECURENOW =
  "SecureNow (Security) is a production security shell — Training, Customer Intake Demo, and NOT LIVE DATA banners are ArchLucid Architecture evaluation chrome. SecureNow operators land on live tenant scope without those training gates." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_RECORD_PRACTICE_BODY =
  "Record means career-grade proof on your live workspace; Practice means explicitly labeled rehearsal. Selecting Record while the header still shows NOT LIVE DATA does not make sample data live — read the workspace label and honesty banners first." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_BLOCKED_REASON_VISIBLE =
  "When workspace creation is blocked, the inline reason appears on the post-auth setup form — not as a hover-only title attribute. Fix membership or request access before retrying." as const;

export const FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY_HEADING = "When sign-in setup fails" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY = {
  whatFailed: "Post-auth workspace setup could not finish — membership, invite acceptance, or tenant provisioning did not complete.",
  whatIsIntact: "Your identity sign-in succeeded; no architecture packages were created or mutated by the failed setup step.",
  nextStep: "Read the visible inline reason on the setup form, retry after an admin confirms membership, or open workspace settings to verify scope.",
} as const;

export type FirstLoginWorkspaceHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING_ID =
  "help-first-login-workspace-related-topics" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING = "Related" as const;

export const FIRST_LOGIN_WORKSPACE_HELP_RELATED_LINKS: readonly FirstLoginWorkspaceHelpRelatedLink[] = [
  { label: "Which mode am I in?", href: inAppHelpHref("which-mode-am-i-in") },
  { label: "Workspace and scope", href: inAppHelpHref("scope") },
  { label: "Workspace settings", href: inAppHelpHref("workspace-settings") },
  { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
] as const;

export const FIRST_LOGIN_WORKSPACE_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const FIRST_LOGIN_WORKSPACE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: FIRST_LOGIN_WORKSPACE_HELP_CLAIM_HEADING_ID, title: "Training is not live tenant proof" },
  { level: 2, id: "help-first-login-invite-heading", title: "Invited users" },
  { level: 2, id: "help-first-login-create-heading", title: "Create or request access" },
  { level: 2, id: "help-first-login-choice-heading", title: "First-time Training question" },
  { level: 2, id: "help-first-login-record-heading", title: "Record, Practice, and Training" },
  { level: 2, id: "help-first-login-not-live-heading", title: "NOT LIVE DATA unexpected" },
  { level: 2, id: "help-first-login-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-first-login-error-recovery", title: FIRST_LOGIN_WORKSPACE_HELP_ERROR_RECOVERY_HEADING },
  { level: 2, id: FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING_ID, title: FIRST_LOGIN_WORKSPACE_HELP_RELATED_TOPICS_HEADING },
] as const;

export const FIRST_LOGIN_WORKSPACE_HELP_CANONICAL_PATH = FIRST_LOGIN_WORKSPACE_HELP_PATH;

export const FIRST_LOGIN_WORKSPACE_HELP_SEARCH_ALIASES = [
  "training mode",
  "not live data",
  "customer intake demo",
  "first login",
  "live data",
  "sample workspace",
  "leave training",
] as const;
