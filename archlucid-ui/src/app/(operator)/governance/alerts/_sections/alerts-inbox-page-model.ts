import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { AlertRecord } from "@/types/alerts";

export type AlertsInboxSearchParams = {
  readonly status?: string;
  /** Opaque keyset token; empty/absent = first page. */
  readonly cursor?: string;
  /** @deprecated Offset page — ignored for inbox fetch (keyset only). Kept for old URLs. */
  readonly page?: string;
};

export type AlertsInboxPageModel = {
  readonly status: string;
  /** 1-based display index within the cursor stack (SSR first paint is always 1). */
  readonly page: number;
  readonly pageSize: number;
  /** Cursor used to load this page (`""` for the first page). */
  readonly cursor: string;
  readonly items: AlertRecord[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly buyerPolishedShell: boolean;
  readonly usedDemoSample: boolean;
};
