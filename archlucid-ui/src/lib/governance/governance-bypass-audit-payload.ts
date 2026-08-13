export const GOVERNANCE_BYPASS_INVOKED_EVENT_TYPE = "GovernanceBypassInvoked";

export type GovernanceBypassAuditPayload = {
  justification: string | null;
  blockingFindingIds: string[];
  policyPackId: string | null;
  minimumBlockingSeverity: string | null;
  gateReason: string | null;
};

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

/** Parses `GovernanceBypassInvoked` audit `dataJson` emitted on pre-commit break-glass commits. */
export function parseGovernanceBypassAuditPayload(dataJson: string): GovernanceBypassAuditPayload {
  try {
    const parsed = JSON.parse(dataJson) as Record<string, unknown>;

    return {
      justification: readOptionalString(parsed.justification),
      blockingFindingIds: readStringArray(parsed.blockingFindingIds),
      policyPackId: readOptionalString(parsed.policyPackId),
      minimumBlockingSeverity: readOptionalString(parsed.minimumBlockingSeverity),
      gateReason: readOptionalString(parsed.gateReason),
    };
  } catch {
    return {
      justification: null,
      blockingFindingIds: [],
      policyPackId: null,
      minimumBlockingSeverity: null,
      gateReason: null,
    };
  }
}
