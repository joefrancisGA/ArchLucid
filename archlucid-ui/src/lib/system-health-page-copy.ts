/** Page copy for `/administration/system-health` (System health). */

export const SYSTEM_HEALTH_PAGE_TITLE = "System health";

export const SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR =
  "Workspace service health, required dependencies, and deployment identity.";

export const SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER =
  "Confirm platform readiness for review workflows in this workspace.";

export const SYSTEM_HEALTH_DEMO_SCOPE_SUMMARY = "About evaluation health data";

/** Stated next to the freshness stamp: this page fetches once per load and on demand. */
export const SYSTEM_HEALTH_REFRESH_POLICY = "Manual refresh only";

export const SYSTEM_HEALTH_CLAIM_SCOPE_SUMMARY = "Health claim scope";

export const SYSTEM_HEALTH_PRIMARY_CONTENT_ID = "system-health-primary-content" as const;

export const SYSTEM_HEALTH_FIRST_VIEWPORT_TEST_ID = "system-health-first-viewport" as const;

export const SYSTEM_HEALTH_SKIP_TARGET_ID = SYSTEM_HEALTH_FIRST_VIEWPORT_TEST_ID;

export const SYSTEM_HEALTH_SKIP_LINK_LABEL = "Skip to system health workspace" as const;

export const SYSTEM_HEALTH_HEADER_CLAIM_DISCIPLINE_TEST_ID = "system-health-header-claim-discipline" as const;

export function systemHealthPageSubtitle(buyerDemoShell: boolean): string {
  return buyerDemoShell ? SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER : SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR;
}
