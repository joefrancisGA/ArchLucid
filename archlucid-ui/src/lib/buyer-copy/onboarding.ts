/**
 * First review guide and optional workspace setup copy.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

/** Collapsed summary on `/architecture/first-review-guide` optional setup disclosure (TB-679). */
export const ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY =
  "Identity, administrator access, platform health, and ROI baseline — optional before your first review.";

/** Explains which steps the home Setup readiness link counts (excludes ROI baseline). */
export const FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_PROGRESS_LEAD =
  "The Setup link on Home tracks identity (SSO), administrator access, and platform health on self-hosted stacks. ROI baseline is separate and does not affect that count.";

/** Collapsed summary when workspace setup steps remain incomplete. */
export function formatOptionalWorkspaceSetupCollapsedSummary(
  readyCount: number,
  totalCount: number,
): string {
  if (totalCount <= 0 || readyCount >= totalCount) {
    return ONBOARDING_OPTIONAL_SETUP_COLLAPSED_SUMMARY;
  }

  const stepNames =
    totalCount >= 3
      ? "identity (SSO), administrator access, and platform health"
      : "identity (SSO) and administrator access";

  return `${readyCount} of ${totalCount} workspace setup steps ready — ${stepNames}.`;
}

/** Post-registration trial handoff on `/architecture/first-review-guide` (TB-679). */
export const GETTING_STARTED_TRIAL_POST_REGISTRATION_LEAD =
  "Confirm trial limits below, then use the checklist on this page or start a review with the sample highlighted on step one.";

export const BUYER_ONBOARDING_PAGE_TITLE = "First review guide";

/** Visible label on the page header contextual help trigger (distinct from shortened "Help"). */
export const FIRST_REVIEW_GUIDE_CONTEXTUAL_HELP_TRIGGER_LABEL = "First Review Guide";

export const BUYER_ONBOARDING_PAGE_LEAD =
  "Create, evaluate, and finalize your first evidence-backed architecture review.";

export const FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE = "Your first review";

export const FIRST_REVIEW_GUIDE_OUTCOMES_TITLE = "What you will have";

export const FIRST_REVIEW_GUIDE_OUTCOMES_COMPLETED_TITLE = "What you have";

export const FIRST_REVIEW_GUIDE_OUTCOMES: readonly string[] = [
  "A finalized architecture review record",
  "Evidence-backed findings",
  "Recorded decisions and exceptions",
  "A shareable review",
] as const;

export const FIRST_REVIEW_GUIDE_OUTCOMES_COMPLETED: readonly string[] = [
  "A sealed review record",
  "Evidence-backed findings",
  "Recorded decisions and exceptions",
  "A shareable architecture package",
] as const;

export const FIRST_REVIEW_GUIDE_SAMPLE_REVIEW_RAIL_TITLE = "Sample architecture package";

export const FIRST_REVIEW_GUIDE_SAMPLE_REVIEW_RAIL_BODY =
  "Open a finalized sample architecture package with demo findings and decisions when you want a reference walkthrough.";

export const FIRST_REVIEW_GUIDE_REQUIRED_SETUP_TITLE = "Required before you start";

export const FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_TITLE = "Optional workspace setup";

export const FIRST_REVIEW_GUIDE_OPTIONAL_SETUP_LEAD =
  "These settings can improve security, administration, and reporting, but most are not required to begin your first review.";

export const FIRST_REVIEW_GUIDE_GET_MORE_TITLE = "Get more from ArchLucid";

export const FIRST_REVIEW_GUIDE_GET_MORE_ROI_COPY =
  "Add an ROI baseline to estimate savings and support sponsor reporting.";

export const FIRST_REVIEW_GUIDE_TEMPLATE_LABEL = "Templates";

export const FIRST_REVIEW_GUIDE_TEMPLATE_BODY =
  "When you start a review, you can pick a template to prefill scope and evidence hints. Choose the one that matches what you are trying to accomplish.";

export const FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION = "Browse templates";

export const FIRST_REVIEW_GUIDE_NEXT_STEP_LABEL = "Next step";

export const ONBOARDING_OPTIONAL_SETUP_DISMISS_LABEL = "Dismiss optional setup";

export const ONBOARDING_OPTIONAL_SETUP_DISMISS_DETAIL =
  "Hides this checklist on this device. It does not validate or complete the underlying settings.";

export const BUYER_ONBOARDING_NAV_TOOLTIP = "First review guide — checklist and milestones";

/** Shown on `/architecture/first-review-guide` when the caller is not a workspace admin (TB-678). */
export const ONBOARDING_WORKSPACE_SETUP_ADMIN_DELEGATION =
  "Workspace identity and ROI setup requires a workspace admin. Ask your administrator to finish optional setup when you are ready.";

export const BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK = "Architecture review walkthrough";
