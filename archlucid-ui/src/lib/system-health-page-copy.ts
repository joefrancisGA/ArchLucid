/** Page copy for `/administration/system-health` (System health). */

export const SYSTEM_HEALTH_PAGE_TITLE = "System health";

export const SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR =
  "Workspace service health, required dependencies, and deployment identity.";

export const SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER =
  "Confirm platform readiness for review workflows in this workspace.";

export const SYSTEM_HEALTH_DEMO_SCOPE_SUMMARY = "About evaluation health data";

export function systemHealthPageSubtitle(buyerDemoShell: boolean): string {
  return buyerDemoShell ? SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER : SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR;
}
