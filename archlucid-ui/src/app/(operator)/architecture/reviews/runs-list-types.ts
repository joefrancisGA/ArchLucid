import type { RunSummary } from "@/types/authority";

export type RunsListClientProps = {
  runs: RunSummary[];
  projectId: string;
  page: number;
  pageSize: number;
  totalCount: number;
  /** From keyset `GET .../runs`; required on Next for page 2+ when the API uses cursor paging. */
  nextCursor?: string | null;
};

export type SortOrder = "createdDesc" | "createdAsc";

export type BuyerPackageScopeFilter = "all" | "finalized" | "in_flight";
