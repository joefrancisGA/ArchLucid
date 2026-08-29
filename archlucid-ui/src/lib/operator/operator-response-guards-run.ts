import { z } from "zod";

import type { PagedResponse } from "@/types/pagination";
import type { RunDetail, RunSummary } from "@/types/authority";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const runSummaryRowSchema = z.object({ runId: z.string() }).passthrough();

/**
 * Ensures the runs list endpoint returned an array of objects with runId (malformed vs empty list).
 */
export function coerceRunSummaryList(
  data: unknown,
): { ok: true; items: RunSummary[] } | { ok: false; message: string } {
  if (!Array.isArray(data)) {
    return { ok: false, message: 'Expected a JSON array of runs; the API returned a non-array body.' };
  }

  const parsed = z.array(runSummaryRowSchema).safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
      message: "One or more run rows are missing a string runId; response shape may be outdated.",
    };
  }

  return { ok: true, items: parsed.data as RunSummary[] };
}

/** Narrowed envelope without `Record<string, unknown>` — an index signature would keep paging fields typed as unknown. */
type LegacyOffsetPagedRunEnvelope = {
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function isLegacyOffsetPagedRunEnvelope(
  data: Record<string, unknown>,
): data is LegacyOffsetPagedRunEnvelope {
  return (
    typeof data.totalCount === "number" &&
    Number.isFinite(data.totalCount) &&
    typeof data.page === "number" &&
    Number.isFinite(data.page) &&
    typeof data.pageSize === "number" &&
    Number.isFinite(data.pageSize) &&
    typeof data.hasMore === "boolean"
  );
}

type CursorPagedRunEnvelope = {
  requestedTake: number;
  hasMore: boolean;
  /** Optional keyset token — validated in `coerceRunSummaryPaged`. */
  nextCursor?: unknown;
};

function isCursorPagedRunEnvelope(data: Record<string, unknown>): data is CursorPagedRunEnvelope {
  return typeof data.requestedTake === "number" && Number.isFinite(data.requestedTake) && typeof data.hasMore === "boolean";
}

function normalizeRunSummaryItems(rawItems: unknown): { ok: true; items: RunSummary[] } | { ok: false; message: string } {
  if (!Array.isArray(rawItems)) {
    return { ok: false, message: 'Paged runs response is missing an "items" array.' };
  }

  const parsed = z.array(runSummaryRowSchema).safeParse(rawItems);

  if (!parsed.success) {
    return {
      ok: false,
      message: "One or more paged run rows are missing a string runId.",
    };
  }

  return { ok: true, items: parsed.data as RunSummary[] };
}

/** Lower bound on total rows so offset-style pagination UI can enable Next when the API uses keyset paging only. */
function keysetTotalCountLowerBound(page: number, pageSize: number, itemCount: number, hasMore: boolean): number {
  const prefixCount = (page - 1) * pageSize + itemCount;

  if (!hasMore) {
    return prefixCount;
  }

  return Math.max(prefixCount + 1, page * pageSize + 1);
}

/**
 * Ensures a paged runs response has an items array of run summaries and paging metadata.
 *
 * Accepts legacy offset pages (`totalCount`, `page`, `pageSize`) or keyset pages (`requestedTake`, `nextCursor`).
 */
export function coerceRunSummaryPaged(
  data: unknown,
  context?: { readonly page?: number },
):
  | { ok: true; value: PagedResponse<RunSummary> }
  | { ok: false; message: string } {
  if (!isRecord(data)) {
    return { ok: false, message: "Expected a JSON object for paged runs." };
  }

  const normalizedItems = normalizeRunSummaryItems(data.items);

  if (!normalizedItems.ok) {
    return normalizedItems;
  }

  const items = normalizedItems.items;

  if (isLegacyOffsetPagedRunEnvelope(data)) {
    return {
      ok: true,
      value: {
        items,
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
        hasMore: data.hasMore,
      },
    };
  }

  if (isCursorPagedRunEnvelope(data)) {
    if (data.nextCursor !== undefined && data.nextCursor !== null && typeof data.nextCursor !== "string") {
      return { ok: false, message: "Paged runs response has invalid nextCursor." };
    }

    const page = context?.page ?? 1;

    if (!Number.isFinite(page) || page < 1) {
      return { ok: false, message: "Paged runs context has invalid page." };
    }

    const pageSize = data.requestedTake;

    return {
      ok: true,
      value: {
        items,
        totalCount: keysetTotalCountLowerBound(page, pageSize, items.length, data.hasMore),
        page,
        pageSize,
        hasMore: data.hasMore,
        nextCursor:
          typeof data.nextCursor === "string" && data.nextCursor.length > 0 ? data.nextCursor : null,
      },
    };
  }

  return {
    ok: false,
    message:
      "Paged runs response is missing offset fields (totalCount, page, pageSize) or keyset fields (requestedTake).",
  };
}

const runDetailSchema = z
  .object({
    run: z
      .object({
        runId: z.string(),
        projectId: z.string(),
        createdUtc: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Ensures run detail envelope has a run object with identifiers.
 */
export function coerceRunDetail(
  data: unknown,
): { ok: true; value: RunDetail } | { ok: false; message: string } {
  const parsed = runDetailSchema.safeParse(data);

  if (!parsed.success) {
    if (!isRecord(data)) {
      return { ok: false, message: "Review detail response was not a JSON object." };
    }

    if (!isRecord(data.run)) {
      return { ok: false, message: 'Review detail response is missing a "run" object.' };
    }

    const run = data.run;

    if (typeof run.runId !== "string" || typeof run.projectId !== "string") {
      return { ok: false, message: "Review detail is missing string runId or projectId." };
    }

    if (typeof run.createdUtc !== "string") {
      return { ok: false, message: "Review detail is missing string createdUtc." };
    }

    return { ok: false, message: "Review detail response was not a JSON object." };
  }

  return { ok: true, value: parsed.data as RunDetail };
}
