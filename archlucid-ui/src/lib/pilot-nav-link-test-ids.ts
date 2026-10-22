/** Stable Playwright/Vitest hooks for Core Pilot sidebar links (assessment Tier 1 #2). */
export function pilotNavLinkTestId(href: string): string | undefined {
  const path = href.split("?")[0] ?? href;

  if (path === "/") {
    return "nav-pilot-home";
  }

  if (path === "/architecture/reviews/new") {
    return "nav-pilot-new-review";
  }

  if (path === "/architecture/reviews") {
    return "nav-pilot-reviews-list";
  }

  if (path === "/administration/baseline") {
    return "nav-pilot-baseline-settings";
  }

  if (path === "/governance/approval-queue") {
    return "nav-operate-governance-workflow";
  }

  if (path === "/governance/findings") {
    return "nav-operate-governance-findings";
  }

  return undefined;
}
