import type { components } from "@/lib/openapi-schemas";

/** OpenAPI offset-paged conversation thread list (`GET /v1/conversations`). */
export type PagedResponseOfConversationThread =
  components["schemas"]["PagedResponseOfConversationThread"];

/** OpenAPI offset-paged draft-request summary list (`GET /v1/drafts`). */
export type PagedResponseOfDraftRequestSummaryResponse =
  components["schemas"]["PagedResponseOfDraftRequestSummaryResponse"];

/** OpenAPI cursor-paged alerts list (`GET /v1/alerts`). */
export type CursorPagedResponseOfAlertRecord =
  components["schemas"]["CursorPagedResponseOfAlertRecord"];

/** OpenAPI cursor-paged audit search results. */
export type CursorPagedResponseOfAuditEvent = components["schemas"]["CursorPagedResponseOfAuditEvent"];

/** OpenAPI cursor-paged architecture run list items. */
export type CursorPagedResponseOfRunListItemResponse =
  components["schemas"]["CursorPagedResponseOfRunListItemResponse"];

/** OpenAPI cursor-paged run summary list (authority run inventories). */
export type CursorPagedResponseOfRunSummaryResponse =
  components["schemas"]["CursorPagedResponseOfRunSummaryResponse"];

/**
 * Generic offset-paged list envelope — structural superset of OpenAPI `PagedResponseOf*` shapes.
 * Prefer concrete `PagedResponseOf*` aliases when the item type is fixed; keep this helper for generic API clients.
 */
export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  /** Keyset token from `GET .../runs` for the next page (omit on legacy offset responses). */
  nextCursor?: string | null;
};

/**
 * Generic cursor-paged list envelope — structural superset of OpenAPI `CursorPagedResponseOf*` shapes.
 * Prefer concrete `CursorPagedResponseOf*` aliases when the item type is fixed; keep this helper for generic API clients.
 */
export type CursorPagedResponse<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor?: string | null;
  requestedTake?: number;
};
