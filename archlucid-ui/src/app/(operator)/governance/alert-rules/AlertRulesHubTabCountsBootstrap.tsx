"use client";

import { useEffect } from "react";

import {
  useAlertRoutingSubscriptionsQuery,
  useAlertRulesListQuery,
  useCompositeAlertRulesListQuery,
} from "@/components/alerts/use-alert-rules-hub-queries";
import { useAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import { latestCompositeAlertRulesConfigChange } from "@/lib/composite-alert-rules-config-change";

/**
 * Keeps hub tab counts and rules provenance accurate even when the operator lands on
 * a non-rules tab first — tab panels mount lazily, but counts must not stay at zero.
 */
export function AlertRulesHubTabCountsBootstrap(): null {
  const { reportTabLoaded } = useAlertRulesHubRefresh();
  const rulesQuery = useAlertRulesListQuery();
  const routingQuery = useAlertRoutingSubscriptionsQuery();
  const compositeQuery = useCompositeAlertRulesListQuery();

  // Do not observe list-array identity: query mocks (and fresh API results) can
  // create equivalent arrays on each render. Updating the hub state in response
  // to those references produces a self-sustaining render/effect cycle.
  // dataUpdatedAt retains honest refresh timestamps when list contents are unchanged.
  const rulesCount = rulesQuery.items.length;
  const routingCount = routingQuery.items.length;
  const compositeCount = compositeQuery.items.length;
  const rulesConfigUtc = latestAlertRulesConfigChange(rulesQuery.items)?.recordedUtc ?? null;
  const compositeConfigUtc = latestCompositeAlertRulesConfigChange(compositeQuery.items)?.recordedUtc ?? null;

  useEffect(() => {
    if (rulesQuery.loading || rulesQuery.failure !== null) {
      return;
    }

    reportTabLoaded(
      "rules",
      rulesCount,
      rulesConfigUtc === null ? null : { recordedUtc: rulesConfigUtc, actor: null },
    );
  }, [
    reportTabLoaded,
    rulesQuery.failure,
    rulesQuery.loading,
    rulesQuery.dataUpdatedAt,
    rulesCount,
    rulesConfigUtc,
  ]);

  useEffect(() => {
    if (routingQuery.loading || routingQuery.failure !== null) {
      return;
    }

    reportTabLoaded("notifications", routingCount);
  }, [
    reportTabLoaded,
    routingQuery.failure,
    routingQuery.loading,
    routingQuery.dataUpdatedAt,
    routingCount,
  ]);

  useEffect(() => {
    if (compositeQuery.loading || compositeQuery.failure !== null) {
      return;
    }

    reportTabLoaded(
      "advanced-rules",
      compositeCount,
      compositeConfigUtc === null ? null : { recordedUtc: compositeConfigUtc, actor: null },
    );
  }, [
    compositeQuery.failure,
    compositeQuery.loading,
    compositeQuery.dataUpdatedAt,
    compositeCount,
    compositeConfigUtc,
    reportTabLoaded,
  ]);

  return null;
}
