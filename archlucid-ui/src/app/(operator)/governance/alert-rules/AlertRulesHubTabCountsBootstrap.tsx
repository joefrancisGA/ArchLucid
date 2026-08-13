"use client";

import { useEffect } from "react";

import {
  useAlertRoutingSubscriptionsQuery,
  useAlertRulesListQuery,
  useCompositeAlertRulesListQuery,
} from "@/components/alerts/use-alert-rules-hub-queries";
import { useAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { latestAlertRulesConfigChange } from "@/lib/alert-rules-config-change";

/**
 * Keeps hub tab counts and rules provenance accurate even when the operator lands on
 * a non-rules tab first — tab panels mount lazily, but counts must not stay at zero.
 */
export function AlertRulesHubTabCountsBootstrap(): null {
  const { reportTabLoaded } = useAlertRulesHubRefresh();
  const rulesQuery = useAlertRulesListQuery();
  const routingQuery = useAlertRoutingSubscriptionsQuery();
  const compositeQuery = useCompositeAlertRulesListQuery();

  useEffect(() => {
    if (rulesQuery.loading || rulesQuery.failure !== null) {
      return;
    }

    reportTabLoaded(
      "rules",
      rulesQuery.items.length,
      latestAlertRulesConfigChange(rulesQuery.items),
    );
  }, [reportTabLoaded, rulesQuery.failure, rulesQuery.items, rulesQuery.loading]);

  useEffect(() => {
    if (routingQuery.loading || routingQuery.failure !== null) {
      return;
    }

    reportTabLoaded("notifications", routingQuery.items.length);
  }, [reportTabLoaded, routingQuery.failure, routingQuery.items, routingQuery.loading]);

  useEffect(() => {
    if (compositeQuery.loading || compositeQuery.failure !== null) {
      return;
    }

    reportTabLoaded("advanced-rules", compositeQuery.items.length);
  }, [compositeQuery.failure, compositeQuery.items, compositeQuery.loading, reportTabLoaded]);

  return null;
}
