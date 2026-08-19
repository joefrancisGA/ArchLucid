export type TrialLimitProblemDetails = {
  trialReason: string;
  daysRemaining: number | null;
};

function readTrimmedString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function readOptionalInteger(obj: Record<string, unknown>, key: string): number | null {
  const value = obj[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  return null;
}

/** Reads `trialReason` and `daysRemaining` from a 402 Problem Details JSON body (root properties). */
export function parseTrialLimitProblemDetails(bodyText: string): TrialLimitProblemDetails | null {
  const trimmed = bodyText.trim();

  if (!trimmed.startsWith("{")) {
    return null;
  }

  let body: unknown;

  try {
    body = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const trialReason = readTrimmedString(record, "trialReason");

  if (trialReason === undefined) {
    return null;
  }

  return {
    trialReason,
    daysRemaining: readOptionalInteger(record, "daysRemaining"),
  };
}

export function formatTrialLimitReasonLabel(trialReason: string): string {
  switch (trialReason) {
    case "Expired":
      return "Your trial has expired.";
    case "RunsExceeded":
      return "You have used all review runs included in your trial.";
    case "SeatsExceeded":
      return "You have reached the seat limit for your trial.";
    case "LifecycleWritesFrozen":
      return "Your workspace is in a read-only trial phase — mutating actions are blocked.";
    case "LifecycleDeletesFrozen":
      return "Deletes are blocked for your trial lifecycle phase.";
    default:
      return "A trial limit blocked this action.";
  }
}
