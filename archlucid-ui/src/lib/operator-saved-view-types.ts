import type { GraphMode } from "@/app/(operator)/graph/_sections/graph-page-helpers";

/** Supported operator UI surfaces for saved views. */
export type OperatorSavedViewSurface = "audit" | "graph";

export type OperatorSavedViewPayload = {
  filters: Record<string, unknown>;
  sort?: string | null;
  columnVisibility?: Record<string, unknown> | null;
};

export type OperatorSavedView = {
  id: string;
  surface: OperatorSavedViewSurface;
  name: string;
  payload: OperatorSavedViewPayload;
  createdUtc: string;
  updatedUtc: string;
};

export type OperatorSavedViewListResponse = {
  views: OperatorSavedView[];
};

export type AuditSavedViewFilters = {
  eventType?: string;
  fromUtc?: string;
  toUtc?: string;
  correlationId?: string;
  actorUserId?: string;
  runId?: string;
  auditDatePreset?: null | "24h" | "7d";
  advancedAuditFiltersOpen?: boolean;
};

export type AuditSavedViewColumnVisibility = {
  showAdvancedFilters?: boolean;
};

export type GraphSavedViewFilters = {
  runId?: string;
  mode?: GraphMode;
  decisionId?: string;
  nodeId?: string;
  depth?: number;
  typeFilter?: string;
};

export type GraphSavedViewColumnVisibility = {
  showNodeKindLegend?: boolean;
};
