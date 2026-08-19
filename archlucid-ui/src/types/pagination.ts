/** Mirrors ArchLucid.Core.Pagination.PagedResponse (camelCase JSON). */
export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  /** Keyset token from `GET .../runs` for the next page (omit on legacy offset responses). */
  nextCursor?: string | null;
};
