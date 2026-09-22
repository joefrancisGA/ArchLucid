import { isApiRequestError } from "@/lib/api-request-error";

export const INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE =
  "PNG rendering is unavailable in this environment." as const;

/** True when the API host has no Mermaid CLI rasterizer (NullDiagramImageRenderer). */
export function isInfraEvidenceMermaidServerPngUnavailableError(error: unknown): boolean {
  if (!isApiRequestError(error)) {
    return false;
  }

  if (error.httpStatus !== 400) {
    return false;
  }

  const detail = error.problem?.detail ?? error.message;

  return detail.includes(INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE);
}
