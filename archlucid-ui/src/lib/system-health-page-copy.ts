/** Page copy for `/health` (System health). */

export const SYSTEM_HEALTH_PAGE_TITLE = "System health";

export const SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR =
  "Workspace service health, required dependencies, and deployment identity.";

export const SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER =
  "Platform readiness and operational checks for this workspace.";

export const SYSTEM_HEALTH_DEMO_SCOPE_SUMMARY = "About demo health data";

export function systemHealthPageSubtitle(buyerDemoShell: boolean): string {
  return buyerDemoShell ? SYSTEM_HEALTH_PAGE_SUBTITLE_BUYER : SYSTEM_HEALTH_PAGE_SUBTITLE_OPERATOR;
}
