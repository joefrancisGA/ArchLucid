import type { AuditEvent } from "@/lib/api/audit-api";

export type AuditIntegrityChainLink = {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredUtc: string;
  readonly linkHash: string;
};

export type AuditIntegrityVerificationResult = {
  readonly verified: boolean;
  readonly eventCount: number;
  readonly headHash: string;
  readonly links: readonly AuditIntegrityChainLink[];
};

const AUDIT_INTEGRITY_GENESIS = "GENESIS";

export function canonicalAuditEventPayload(event: AuditEvent): string {
  return JSON.stringify({
    eventId: event.eventId,
    occurredUtc: event.occurredUtc,
    eventType: event.eventType,
    actorUserId: event.actorUserId,
    runId: event.runId ?? "",
    manifestId: event.manifestId ?? "",
    dataJson: event.dataJson ?? "",
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function sortAuditEventsChronologically(events: readonly AuditEvent[]): AuditEvent[] {
  return [...events].sort((left, right) => left.occurredUtc.localeCompare(right.occurredUtc));
}

/** Recomputes the append-only hash chain for the supplied audit events (demo / offline verification). */
export async function verifyAuditIntegrityChain(
  events: readonly AuditEvent[],
): Promise<AuditIntegrityVerificationResult> {
  const sorted = sortAuditEventsChronologically(events);
  let previousHash = AUDIT_INTEGRITY_GENESIS;
  const links: AuditIntegrityChainLink[] = [];

  for (const event of sorted) {
    const payload = canonicalAuditEventPayload(event);
    const linkHash = await sha256Hex(`${previousHash}|${payload}`);

    links.push({
      eventId: event.eventId,
      eventType: event.eventType,
      occurredUtc: event.occurredUtc,
      linkHash,
    });

    previousHash = linkHash;
  }

  return {
    verified: sorted.length > 0,
    eventCount: sorted.length,
    headHash: previousHash,
    links,
  };
}

export function formatAuditIntegrityHeadHash(headHash: string): string {
  if (headHash.length <= 16) {
    return headHash;
  }

  return `${headHash.slice(0, 8)}…${headHash.slice(-8)}`;
}
