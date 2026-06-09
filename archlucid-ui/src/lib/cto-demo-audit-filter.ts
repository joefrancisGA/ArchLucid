/** Demo-relevant audit lifecycle milestones for the CTO demo step-5 spine. */
export const CTO_DEMO_AUDIT_EVENT_TYPES = [
  "RunStarted",
  "findings.snapshot.created",
  "finalize.run",
  "artifact.bundle.created",
] as const;

export type CtoDemoAuditEventType = (typeof CTO_DEMO_AUDIT_EVENT_TYPES)[number];

export const CTO_DEMO_AUDIT_FILTER_QUERY_PARAM = "filter";

export const CTO_DEMO_AUDIT_FILTER_VALUE = "demo";

export function isCtoDemoRelevantAuditEvent(eventType: string): boolean {
  const normalized = eventType.trim();

  return (CTO_DEMO_AUDIT_EVENT_TYPES as readonly string[]).includes(normalized);
}

export function buildCtoDemoAuditFilterQueryString(): string {
  return `${CTO_DEMO_AUDIT_FILTER_QUERY_PARAM}=${CTO_DEMO_AUDIT_FILTER_VALUE}`;
}

export function isCtoDemoAuditFilterActive(filterParam: string | null): boolean {
  return filterParam?.trim().toLowerCase() === CTO_DEMO_AUDIT_FILTER_VALUE;
}
