import {
  auditBuyerEventIsSystemRecordedActor,
} from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export const AUDIT_PAGE_SIZE = 200;

export type ResolveAuditScopedRunIdInput = {
  readonly urlRunId: string;
  readonly pathname: string;
  readonly search: string;
  readonly workspaceActiveRunId: string | null;
};

/** Review id the audit page should scope to from URL or operator shell context. */
export function resolveAuditScopedRunId(input: ResolveAuditScopedRunIdInput): string {
  const fromUrl = input.urlRunId.trim();

  if (fromUrl.length > 0) {
    return fromUrl;
  }

  const fromShell = resolveOperatorShellAuditRunId({
    pathname: input.pathname,
    search: input.search,
    workspaceActiveRunId: input.workspaceActiveRunId,
  });

  return fromShell ?? "";
}

/** True when auto-search should wait for runId state to match the scoped review. */
export function shouldDeferAuditAutoSearch(currentRunId: string, scopedRunId: string): boolean {
  if (scopedRunId.length === 0) {
    return false;
  }

  return currentRunId !== scopedRunId;
}

export function formatUtc(iso: string): string {
  try {
    const d = new Date(iso);

    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

export function toDatetimeLocalInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function auditRunIdInputDisplayValue(buyerPolishedShell: boolean, runIdState: string): string {
  if (!buyerPolishedShell) {
    return runIdState;
  }

  const t = runIdState.trim();

  if (t.length === 0) {
    return "";
  }

  return buyerFacingReviewLinkLabelFromRunId(runIdState);
}

export function auditRunIdParseInputValue(buyerPolishedShell: boolean, raw: string): string {
  if (!buyerPolishedShell) {
    return raw;
  }

  const t = raw.trim();

  if (t.length === 0) {
    return "";
  }

  const showcaseFriendly = buyerFacingReviewLinkLabelFromRunId(SHOWCASE_STATIC_DEMO_RUN_ID);

  if (t === showcaseFriendly) {
    return SHOWCASE_STATIC_DEMO_RUN_ID;
  }

  const canon = canonicalizeDemoRunId(t);

  if (canon === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return SHOWCASE_STATIC_DEMO_RUN_ID;
  }

  return t;
}

export function tryFormatDataJson(dataJson: string): string {
  try {
    const parsed: unknown = JSON.parse(dataJson);

    return JSON.stringify(parsed, null, 2);
  } catch {
    return dataJson;
  }
}

export function auditBuyerActorRoleLine(actorName: string, eventType: string): string {
  const name = actorName.trim();

  if (auditBuyerEventIsSystemRecordedActor(name)) {
    return "Automatically recorded";
  }

  if (eventType.trim().toLowerCase() === "finalize.run") {
    return "Approver";
  }

  return "Participant";
}

import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";

export interface AuditFilterFields {
  eventType: string;
  fromUtc: string;
  toUtc: string;
  correlationId: string;
  actorUserId: string;
  runId: string;
}

export function buildAuditSavedViewPayload(
  filters: AuditFilterFields,
  auditDatePreset: null | "24h" | "7d",
  advancedAuditFiltersOpen: boolean,
): OperatorSavedViewPayload {
  return {
    filters: {
      eventType: filters.eventType,
      fromUtc: filters.fromUtc,
      toUtc: filters.toUtc,
      correlationId: filters.correlationId,
      actorUserId: filters.actorUserId,
      runId: filters.runId,
      auditDatePreset,
      advancedAuditFiltersOpen,
    },
    sort: "occurredUtc:desc",
    columnVisibility: {
      showAdvancedFilters: advancedAuditFiltersOpen,
    },
  };
}
