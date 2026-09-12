/** CG-094 — failed-integration DLQ is ops triage, not sealed Career proof. */
export const INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE =
  "Ops queue — not sealed Career proof";

export const INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_BODY =
  "Dead-lettered outbound integration events await retry after a delivery failure. A row here does not mean the linked review is Career-complete or sealed — open the review workspace for posture before citing outcomes.";

export const INTEGRATION_EVENTS_DLQ_CROSS_TENANT_OPS_SUFFIX =
  "This Internal Operations surface is not sponsor-ready evidence.";

export type IntegrationEventsDlqCareerHonestyPresentation = {
  readonly title: string;
  readonly body: string;
};

/** DLQ is always ops-only — honesty strip is unconditional on the route. */
export function resolveIntegrationEventsDlqCareerHonesty(): IntegrationEventsDlqCareerHonestyPresentation {
  return {
    title: INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE,
    body: INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_BODY,
  };
}
