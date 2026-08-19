import { SEE_IT_CANONICAL_PATH } from "@/lib/see-it-evidence-copy";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";

export const SHOWCASE_PRIMARY_CONTENT_ID = "showcase-primary-content" as const;

export const SHOWCASE_BREADCRUMB_HUB_LABEL = SEE_IT_PAGE_TITLE;

export const SHOWCASE_BREADCRUMB_HUB_PATH = SEE_IT_CANONICAL_PATH;

export const SHOWCASE_BREADCRUMB_TOPIC_TITLE = "Sample showcase" as const;

export const SHOWCASE_HERO_SUBTITLE_OPERATOR =
  "Reviewed architecture output — review, findings, and audit trail";

export const SHOWCASE_HERO_SUBTITLE_BUYER =
  "Sample review output — findings, decisions, and audit trail";

/** Marketing showcase hero subtitle — shorter buyer-oriented line. */
export const SHOWCASE_HERO_SUBTITLE = SHOWCASE_HERO_SUBTITLE_BUYER;

export function showcaseTitleForRunId(runId: string): string {
  const decoded = decodeURIComponent(runId);

  if (decoded === "claims-intake-modernization") {
    return "Claims Intake Modernization: Completed Architecture Output";
  }

  if (decoded === "customer-intake-modernization") {
    return "Enterprise Customer Intake Modernization: Completed Architecture Output";
  }

  return `Completed example (${decoded})`;
}

export function showcaseScenarioRibbonLabel(runId: string): string {
  const decoded = decodeURIComponent(runId);

  if (decoded === "customer-intake-modernization") {
    return "Enterprise Customer Intake Modernization sample scenario.";
  }

  return "Claims Intake Modernization sample scenario.";
}
