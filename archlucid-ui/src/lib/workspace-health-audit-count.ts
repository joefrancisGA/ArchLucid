import { searchAuditEvents } from "@/lib/api";

const MAX_PAGES = 50;
const PAGE_SIZE = 500;

export type AuditEventCountResult = {
  count: number;
  exact: boolean;
};

/**
 * Counts audit rows for a type and window. Pages until exhausted or safety cap — honest `exact: false` when capped.
 */
export async function countAuditEventsInWindow(input: {
  eventType: string;
  fromUtcIso: string;
  toUtcIso: string;
}): Promise<AuditEventCountResult> {
  let count = 0;
  let cursor: string | undefined;
  let pages = 0;
  const seenCursors = new Set<string>();

  while (pages < MAX_PAGES) {
    const res = await searchAuditEvents({
      eventType: input.eventType,
      fromUtc: input.fromUtcIso,
      toUtc: input.toUtcIso,
      take: PAGE_SIZE,
      cursor,
    });

    const nextCursor = res.nextCursor?.trim();
    if (res.hasMore && nextCursor && seenCursors.has(nextCursor)) {
      return { count, exact: false };
    }

    count += res.items.length;
    pages++;

    if (!res.hasMore) {
      return { count, exact: true };
    }

    if (!nextCursor) {
      return { count, exact: false };
    }

    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return { count, exact: false };
}
