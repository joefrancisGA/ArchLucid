/** Request/response payload shaping shared by live-API helpers: id comparison, paging, admission copy. */

/**
 * Compares run ids across API surfaces: architecture routes use 32-char hex (`Guid.ToString("N")`),
 * while authority run detail JSON serializes `Guid` with hyphens. The operator UI shows the authority value.
 */
export function normalizeRunIdForCompare(value: string): string {
  return value.replace(/-/g, "").trim().toLowerCase();
}

/** Unwraps `CursorPagedResponse` (`items` / legacy bare array) for live API list endpoints. */
export function unwrapCursorPagedResponseItems<T>(body: unknown): T[] {

  if (Array.isArray(body)) {
    return body;
  }

  if (body !== null && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const items = record.items ?? record.Items;

    if (Array.isArray(items)) {
      return items as T[];
    }
  }

  return [];
}

/** Matches LlmSemanticAdmissionGate architecture-domain heuristic (see ArchLucid.Application). */
const liveE2eArchitectureAdmissionRegex =
  /\b(architecture|system|database|api|service|cloud|azure|aws|gcp|security|compliance|tenant|scale|latency|throughput|auth|identity)\b/i;

/**
 * Builds a POST `/v1/architecture/request` description that passes semantic admission.
 * Prefix with test-specific intent; appends architecture vocabulary when the intent alone would be rejected.
 */
export function liveE2eArchitectureDescription(testIntent: string): string {
  const intent = testIntent.trim();

  if (liveE2eArchitectureAdmissionRegex.test(intent)) {
    return intent;
  }

  return `${intent} Secure Azure API service architecture with SQL database, managed identity auth, and cloud compliance constraints.`;
}

function resolveArchitectureDescriptionField(description: unknown, fallbackIntent: string): string {

  if (typeof description === "function") {
    return (description as (intent: string) => string)(fallbackIntent);
  }

  if (typeof description === "string") {
    return description.trim();
  }

  return "";
}

/**
 * Enriches POST `/v1/architecture/request` bodies so thin descriptions or specs that pass
 * {@link liveE2eArchitectureDescription} by reference pass semantic admission in ApiKey/JWT lanes.
 */
export function enrichArchitectureRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  const intent =
    typeof body.systemName === "string" && body.systemName.trim().length > 0
      ? body.systemName.trim()
      : "Live E2E architecture request";

  const description = resolveArchitectureDescriptionField(body.description, intent);

  if (liveE2eArchitectureAdmissionRegex.test(description)) {
    return { ...body, description };
  }

  const suffix = description.length > 0 ? ` Context: ${description}` : "";

  return {
    ...body,
    description: liveE2eArchitectureDescription(intent) + suffix,
  };
}

/** True when the API rejected self-service registration because the deployment is invite-only. */
export function isInviteOnlyRegistrationResponse(status: number, bodyText: string): boolean {

  if (status !== 404) {
    return false;
  }

  return /registration is by invitation/i.test(bodyText);
}
