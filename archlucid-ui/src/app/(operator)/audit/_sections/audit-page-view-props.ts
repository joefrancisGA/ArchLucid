import type { Dispatch, SetStateAction } from "react";

import type { AuditEvent } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export type AuditPageEventGroup = {
  readonly stage: string;
  readonly events: AuditEvent[];
};

export type AuditBuyerTrailMetrics = {
  readonly eventCount: number;
  readonly humanActorCount: number;
  readonly systemRecordedCount: number;
};

/** Props for the presentational audit layout; produced by `useAuditPage(serverLoad)`. */
export type AuditPageViewProps = {
  readonly buyerPolishedShell: boolean;
  readonly runId: string;
  readonly buyerAuditTrailSummaryLine: string | null;
  readonly buyerAuditTrailMetrics: AuditBuyerTrailMetrics | null;
  readonly displayEvents: AuditEvent[];
  readonly callerAuthorityRank: number;
  readonly exportRoleOk: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly canMutateEnterpriseShell: boolean;
  readonly advancedAuditFiltersOpen: boolean;
  readonly setAdvancedAuditFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly buyerPrimaryFiltersOpen: boolean;
  readonly setBuyerPrimaryFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly eventTypes: string[];
  readonly eventType: string;
  readonly setEventType: Dispatch<SetStateAction<string>>;
  readonly fromUtc: string;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly toUtc: string;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly correlationId: string;
  readonly setCorrelationId: Dispatch<SetStateAction<string>>;
  readonly actorUserId: string;
  readonly setActorUserId: Dispatch<SetStateAction<string>>;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly searching: boolean;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => Promise<void>;
  readonly clearDateRangeAndSearch: () => Promise<void>;
  readonly runSearch: () => Promise<void>;
  readonly clearFiltersAndSearch: () => Promise<void>;
  readonly events: AuditEvent[];
  readonly displayEventGroups: AuditPageEventGroup[] | null;
  readonly hasMoreResults: boolean;
  readonly loadingMore: boolean;
  readonly uniformRunIdForDisplay: string | null;
  readonly auditSearchEmptyLine: string;
  readonly loadMore: () => Promise<void>;
  readonly csvExportUiAllowed: boolean;
  readonly exporting: boolean;
  readonly exportDateRangeReady: boolean;
  readonly onExportCsv: () => Promise<void>;
};
