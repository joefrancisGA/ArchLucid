/**
 * Workspace scope, demo workspace, and sample-data copy.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

import {
  CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE,
  CUSTOMER_INTAKE_SAMPLE_DEFINITION,
} from "@/lib/samples/customer-intake-modernization/definition";

const customerIntakeWorkspaceLabel = CUSTOMER_INTAKE_SAMPLE_DEFINITION.workspaceLabel;
const customerIntakePackageTitle = CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE;

export const BUYER_WORKSPACE_SHORT_NAME = customerIntakePackageTitle.replace(/\s+Modernization$/i, "");

export const BUYER_WORKSPACE_DISPLAY_NAME = `${BUYER_WORKSPACE_SHORT_NAME} Workspace`;

export const BUYER_EXAMPLE_WORKSPACE_TOOLTIP =
  `${BUYER_WORKSPACE_SHORT_NAME} workspace — demonstration data for architecture review walkthroughs.`;

export const BUYER_SEED_EXAMPLE_REVIEW_CTA = "Load the example review";

export const BUYER_SEED_EXAMPLE_REVIEW_HINT =
  "Loads the interactive example review so you can explore outputs before uploading your own architecture context.";

/** Forbidden-state copy when a surface requires workspace administrator access. */
export const FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE =
  "This page requires a workspace administrator. Sign in with an admin account or API key.";

export const FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE_SHORT =
  "This page requires a workspace administrator.";

export const BUYER_VIEWING_AS_DEMO_ROLE = "Role: Architecture reviewer";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL = "Sample workspace";

/** Compact top-bar label for the dev/sample workspace selector button. */
export const BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL = customerIntakeWorkspaceLabel;

/** Full sample workspace name shown in the scope dropdown and accessible labels. */
export const BUYER_SCOPE_SAMPLE_WORKSPACE_FULL_NAME = customerIntakePackageTitle;

export const BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT = "Demo data only. Your workspace is unchanged.";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE = "Sample workspace";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_BODY =
  "Workspace switching is disabled in this local demo. In a connected tenant, this menu lets you switch between workspaces and projects.";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_CONNECTED_HINT =
  "In a connected tenant, this menu lets you switch between workspaces and projects.";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_DETAILS = "Workspace details";

/** Shown only inside the sample-workspace popover workspace-details disclosure. */
export const BUYER_SCOPE_SAMPLE_WORKSPACE_TECHNICAL_DETAILS =
  "Scope headers (tenant, workspace, project) route API requests. The workspace directory API is not available in this local demo, so the sample workspace stays active.";

/** Closes the workspace scope popover (`role="dialog"`); not a workflow advance or permanent hide. */
export const BUYER_SCOPE_SWITCHER_CLOSE = "Close";

export const BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES = "Workspace guide";

export const BUYER_SCOPE_SWITCHER_CONNECTED_INTRO = "Choose a workspace and project.";

export const BUYER_SCOPE_CURRENT_WORKSPACE_TITLE = "Current workspace";

export const BUYER_SCOPE_CURRENT_WORKSPACE_BODY =
  "You are viewing the active workspace and project for this tenant.";

export const BUYER_SCOPE_SWITCHER_LOAD_ERROR =
  "We couldn't load workspaces for this tenant. Try again or contact support if the problem continues.";

/** Legacy intro — prefer {@link BUYER_SCOPE_SAMPLE_WORKSPACE_BODY} in sample popovers. */
export const BUYER_SCOPE_SWITCHER_INTRO =
  `This walkthrough uses the ${customerIntakePackageTitle} sample workspace. Switching live tenant scope is not required.`;

/** Legacy list-unavailable copy — keep for technical disclosures only. */
export const BUYER_SCOPE_LIST_UNAVAILABLE =
  "Workspace directory is unavailable in this environment. The sample workspace remains active for this session.";

export const BUYER_DEMO_GOVERNANCE_WORKFLOW_UNAVAILABLE =
  "Governance workflow is not configured in this demo workspace.";

export const BUYER_DEMO_ITSM_LINKAGE_UNAVAILABLE =
  "ITSM integration is not connected in this demo workspace.";

export const BUYER_DEMO_EVALUATION_WORKSPACE_BADGE = "Evaluation workspace";

export const BUYER_DEMO_EVALUATION_WORKSPACE_STATUS = `${customerIntakeWorkspaceLabel} · Buyer evaluation workspace`;

export const BUYER_SEED_SAMPLE_WORKSPACE_CTA = "Load sample workspace";

/** Toast after demo seed succeeds — dashboard may stay on sponsor dashboard while caches refresh. */
export const BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS = "Sample workspace loaded.";

export const BUYER_TRY_SAMPLE_REVIEW_CTA = "Try sample review";

export const BUYER_SEE_COMPLETED_OUTPUT_CTA = "See completed output";

export const BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE =
  `This capability is not enabled in the ${customerIntakeWorkspaceLabel} workspace.`;

export const BUYER_DEMO_CAPABILITY_UNAVAILABLE_BODY =
  "In a connected tenant, administrators configure users, support routing, digest subscriptions, and system health here.";

export const BUYER_DEMO_CAPABILITY_TROUBLESHOOTING_CTA = "Open troubleshooting";

/** @deprecated Prefer {@link BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE} — title is workspace-scoped, not capability-scoped. */
export function buyerDemoCapabilityUnavailableTitle(): string {
  return BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE;
}

export const BUYER_EXAMPLE_COUNT_SUFFIX = "(example)";
