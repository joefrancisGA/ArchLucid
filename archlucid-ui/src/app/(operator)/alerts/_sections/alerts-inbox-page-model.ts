import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { AlertRecord } from "@/types/alerts";

export type AlertsInboxSearchParams = {
  readonly status?: string;
  readonly page?: string;
};

export type AlertsInboxPageModel = {
  readonly status: string;
  readonly page: number;
  readonly pageSize: number;
  readonly items: AlertRecord[];
  readonly totalCount: number;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly buyerPolishedShell: boolean;
  readonly usedDemoSample: boolean;
};
