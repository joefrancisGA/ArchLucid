"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  listAlertRules,
  listAlertRoutingSubscriptions,
  listCompositeAlertRules,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { AlertRoutingSubscription } from "@/types/alert-routing";
import type { AlertRule } from "@/types/alerts";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";

const EMPTY_ALERT_RULES: AlertRule[] = [];
const EMPTY_ROUTING_SUBSCRIPTIONS: AlertRoutingSubscription[] = [];
const EMPTY_COMPOSITE_RULES: CompositeAlertRule[] = [];

type AlertRulesHubListQueryResult<TItem> = {
  readonly items: readonly TItem[];
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly refresh: () => Promise<void>;
};

function normalizeHubListItems<TItem>(data: unknown, emptyItems: readonly TItem[]): readonly TItem[] {
  if (Array.isArray(data)) {
    return data;
  }

  return emptyItems;
}

function useAlertRulesHubListQuery<TItem>(args: {
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<TItem[]>;
  readonly emptyItems: readonly TItem[];
}): AlertRulesHubListQueryResult<TItem> {
  const query = useQuery({
    queryKey: args.queryKey,
    queryFn: args.queryFn,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  const refresh = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  return {
    items: normalizeHubListItems(query.data, args.emptyItems),
    loading: query.isPending || query.isFetching,
    failure: query.isError ? toApiLoadFailure(query.error) : null,
    refresh,
  };
}

/** Shared alert-rules list for the hub conditions tab (and readiness panels). */
export function useAlertRulesListQuery(): AlertRulesHubListQueryResult<AlertRule> {
  const scope = useOperatorScopeQueryKey();

  return useAlertRulesHubListQuery({
    queryKey: operatorQueryKeys.alertRulesList(scope),
    queryFn: listAlertRules,
    emptyItems: EMPTY_ALERT_RULES,
  });
}

/**
 * Shared routing subscriptions for the hub notifications tab and the conditions-tab
 * notification-readiness rail — one cache entry avoids duplicate list calls on tab switch.
 */
export function useAlertRoutingSubscriptionsQuery(): AlertRulesHubListQueryResult<AlertRoutingSubscription> {
  const scope = useOperatorScopeQueryKey();

  return useAlertRulesHubListQuery({
    queryKey: operatorQueryKeys.alertRoutingSubscriptions(scope),
    queryFn: listAlertRoutingSubscriptions,
    emptyItems: EMPTY_ROUTING_SUBSCRIPTIONS,
  });
}

/** Shared composite rules list for the hub advanced-rules tab. */
export function useCompositeAlertRulesListQuery(): AlertRulesHubListQueryResult<CompositeAlertRule> {
  const scope = useOperatorScopeQueryKey();

  return useAlertRulesHubListQuery({
    queryKey: operatorQueryKeys.compositeAlertRulesList(scope),
    queryFn: listCompositeAlertRules,
    emptyItems: EMPTY_COMPOSITE_RULES,
  });
}
