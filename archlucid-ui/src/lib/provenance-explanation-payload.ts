export type ExplanationPayloadFields = Readonly<{
  message: string | null;
  detail: string | null;
  title: string | null;
  aggregateExplanationPathTemplate: string | null;
  granularExplanationPathTemplate: string | null;
  errorCode: string | null;
}>;

/** Coordinator provenance explanation: legacy 501 surface returns RFC 9457 Problem Details (formerly `{ message }` stub). */
export function parseProvenanceExplanationPayload(raw: unknown): ExplanationPayloadFields {
  if (raw === null || typeof raw !== "object")
    return {
      message: null,
      detail: null,
      title: null,
      aggregateExplanationPathTemplate: null,
      granularExplanationPathTemplate: null,
      errorCode: null,
    };

  const body = raw as Record<string, unknown>;

  return {
    message: typeof body.message === "string" ? body.message : null,
    detail: typeof body.detail === "string" ? body.detail : null,
    title: typeof body.title === "string" ? body.title : null,
    aggregateExplanationPathTemplate:
      typeof body.aggregateExplanationPathTemplate === "string" ? body.aggregateExplanationPathTemplate : null,
    granularExplanationPathTemplate:
      typeof body.granularExplanationPathTemplate === "string" ? body.granularExplanationPathTemplate : null,
    errorCode: typeof body.errorCode === "string" ? body.errorCode : null,
  };
}

export function applyPathTemplate(template: string, runId: string): string {
  return template.replace("{runId}", encodeURIComponent(runId));
}
