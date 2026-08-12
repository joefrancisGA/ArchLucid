import { searchAuditEvents, type AuditEvent } from "@/lib/api";
import { GOVERNANCE_BYPASS_INVOKED_EVENT_TYPE } from "@/lib/governance-bypass-audit-payload";

export type ListRecentGovernanceBypassAuditEventsInput = {
  readonly days?: number;
  readonly take?: number;
};

function rollingBounds(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

/** Loads the most recent pre-commit governance bypass audit events for dashboard visibility. */
export async function listRecentGovernanceBypassAuditEvents(
  input: ListRecentGovernanceBypassAuditEventsInput = {},
): Promise<AuditEvent[]> {
  const days = input.days ?? 30;
  const take = input.take ?? 25;
  const bounds = rollingBounds(days);

  const response = await searchAuditEvents({
    eventType: GOVERNANCE_BYPASS_INVOKED_EVENT_TYPE,
    fromUtc: bounds.fromUtc,
    toUtc: bounds.toUtc,
    take,
  });

  return response.items;
}
