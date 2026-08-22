import type { AuditEvent } from "@/lib/api";
import { formatActionActorName } from "@/lib/action-actor-display";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";

/** Neutral role titles for buyer-polished surfaces (TB-273 / BDA-003, 007, 022). */
export const BUYER_DEMO_ARCHITECTURE_REVIEW_LEAD = "Architecture Review Lead";

export const BUYER_DEMO_GOVERNANCE_APPROVER = "Approval lead";

export const BUYER_DEMO_ARCHITECTURE_REVIEWER_ROLE = "Architecture reviewer";

export const BUYER_DEMO_REVIEW_OWNER_ROLE = "Review owner";

const SCRIPTED_ACTOR_NAMES = new Set(["Jordan Lee", "Taylor Morgan"]);

export function isScriptedDemoActorName(name: string | null | undefined): boolean {  if (!isBuyerSafeDemoMarketingChromeEnv()) {
    return false;
  }

  if (name === null || name === undefined) {
    return false;
  }

  return SCRIPTED_ACTOR_NAMES.has(name.trim());
}

export function buyerSafeActorDisplayName(name: string | null | undefined, _eventType: string): string {
  return formatActionActorName(name);
}

export function buyerSafeTechnicalIdLabel(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();

  if (value.length === 0) {
    return " — ";
  }

  if (/^demo-/i.test(value) || /^corr-intake-demo/i.test(value) || /^sample-decision-/i.test(value)) {
    return "Recorded in workspace audit trail";
  }

  return value;
}

/** Strip demo-prefixed ids and fictional actor names from curated audit rows (BDA-006, 010). */
export function sanitizeAuditEventForBuyerPolishedShell(event: AuditEvent): AuditEvent {
  return {
    ...event,
    actorUserId: buyerSafeTechnicalIdLabel(event.actorUserId),
    actorUserName: buyerSafeActorDisplayName(event.actorUserName, event.eventType),
    tenantId: /^demo-tenant$/i.test((event.tenantId ?? "").trim()) ? "workspace" : event.tenantId,
    correlationId: buyerSafeTechnicalIdLabel(event.correlationId),
  };
}

export function sanitizeAuditEventsForBuyerPolishedShell(events: AuditEvent[]): AuditEvent[] {
  return events.map(sanitizeAuditEventForBuyerPolishedShell);
}

export function buyerSafeGovernanceActorLabel(name: string | null | undefined): string {
  return formatActionActorName(name);
}
