"use client";

import { useMemo } from "react";

import {
  auditEventLifecycleSortKey,
  auditEventsAreLifecycleOnlyForGrouping,
  formatBuyerAuditTrailSummaryLine,
  groupAuditEventsByLifecycleStage,
} from "@/app/(operator)/governance/audit/audit-ui-helpers";
import { buyerAuditTrailGovernanceSummaryCounts } from "@/lib/audit-trail-page-helpers";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  auditSearchNoResultsBuyerPolishedLine,
  auditSearchNoResultsOperatorLine,
  auditSearchNoResultsReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isCtoDemoRelevantAuditEvent } from "@/lib/cto-demo-audit-filter";
import type { AuditEvent } from "@/lib/api";
import type { AuditTrailViewMode } from "@/lib/audit-trail-view-mode";

export type UseAuditPageLifecycleGroupsArgs = {
  readonly buyerPolishedShell: boolean;
  readonly viewMode: AuditTrailViewMode;
  readonly events: readonly AuditEvent[];
  readonly runId: string;
  readonly ctoDemoAuditFilterActive: boolean;
};

export type UseAuditPageLifecycleGroupsResult = {
  readonly auditSearchEmptyLine: string;
  readonly displayEvents: AuditEvent[];
  readonly displayEventGroups: ReturnType<typeof groupAuditEventsByLifecycleStage> | null;
  readonly uniformRunIdForDisplay: string | null;
  readonly buyerAuditTrailSummaryLine: string | null;
  readonly buyerAuditTrailMetrics: ReturnType<typeof buyerAuditTrailGovernanceSummaryCounts> | null;
};

export function useAuditPageLifecycleGroups(
  args: UseAuditPageLifecycleGroupsArgs,
): UseAuditPageLifecycleGroupsResult {
  const { buyerPolishedShell, viewMode, events, runId, ctoDemoAuditFilterActive } = args;
  const callerAuthorityRank = useNavCallerAuthorityRank();

  const auditSearchEmptyLine = useMemo(
    () =>
      buyerPolishedShell
        ? auditSearchNoResultsBuyerPolishedLine
        : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
          ? auditSearchNoResultsReaderLine
          : auditSearchNoResultsOperatorLine,
    [buyerPolishedShell, callerAuthorityRank],
  );

  const storyPresentation = viewMode === "story";

  const sortedDisplayEvents = useMemo(() => {
    if (!storyPresentation) {
      return events;
    }

    return [...events].sort((eventA, eventB) => {
      const rankDiff =
        auditEventLifecycleSortKey(eventA.eventType) - auditEventLifecycleSortKey(eventB.eventType);

      if (rankDiff !== 0) {
        return rankDiff;
      }

      return eventA.occurredUtc.localeCompare(eventB.occurredUtc);
    });
  }, [events, storyPresentation]);

  const displayEvents = useMemo(() => {
    if (!ctoDemoAuditFilterActive) {
      return sortedDisplayEvents;
    }

    return sortedDisplayEvents.filter((event) => isCtoDemoRelevantAuditEvent(event.eventType));
  }, [ctoDemoAuditFilterActive, sortedDisplayEvents]);

  const displayEventGroups = useMemo(() => {
    const eligible = storyPresentation && auditEventsAreLifecycleOnlyForGrouping(displayEvents);

    if (!eligible) {
      return null;
    }

    return groupAuditEventsByLifecycleStage(displayEvents);
  }, [displayEvents, storyPresentation]);

  const uniformRunIdForDisplay = useMemo(() => {
    if (displayEvents.length === 0) {
      return null;
    }

    const firstId = displayEvents[0].runId?.trim() ?? "";

    if (firstId.length === 0) {
      return null;
    }

    const allSame = displayEvents.every((ev) => (ev.runId?.trim() ?? "") === firstId);

    return allSame ? firstId : null;
  }, [displayEvents]);

  const buyerAuditTrailSummaryLine = useMemo(() => {
    if (!buyerPolishedShell || displayEvents.length === 0) {
      return null;
    }

    return formatBuyerAuditTrailSummaryLine(displayEvents, uniformRunIdForDisplay, runId);
  }, [buyerPolishedShell, displayEvents, uniformRunIdForDisplay, runId]);

  const buyerAuditTrailMetrics = useMemo(() => {
    if (!buyerPolishedShell) {
      return null;
    }

    return buyerAuditTrailGovernanceSummaryCounts(displayEvents);
  }, [buyerPolishedShell, displayEvents]);

  return {
    auditSearchEmptyLine,
    displayEvents,
    displayEventGroups,
    uniformRunIdForDisplay,
    buyerAuditTrailSummaryLine,
    buyerAuditTrailMetrics,
  };
}
