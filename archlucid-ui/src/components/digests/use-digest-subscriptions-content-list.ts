"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  DIGEST_SUBSCRIPTION_ATTEMPTS_TAKE,
  useDigestSubscriptionDeliveryAttemptsQueries,
} from "@/hooks/use-digest-subscription-delivery-attempts-query";
import { useDigestSubscriptionsQuery } from "@/hooks/use-digest-subscriptions-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { listSubscriptionDeliveryAttempts } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import {
  resolveContinueLastDigestSubscription,
  writeDigestSubscriptionLastViewedId,
} from "@/lib/resolve-continue-last-digest-subscription";

const EMPTY_SUBSCRIPTIONS: DigestSubscription[] = [];

export type UseDigestSubscriptionsContentListArgs = {
  readonly refreshToken: number;
};

export function useDigestSubscriptionsContentList(args: UseDigestSubscriptionsContentListArgs) {
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const subscriptionsQuery = useDigestSubscriptionsQuery();
  const items = subscriptionsQuery.data ?? EMPTY_SUBSCRIPTIONS;
  const continueLastSubscription = useMemo(
    () => resolveContinueLastDigestSubscription(items),
    [items],
  );
  const subscriptionIds = useMemo(() => items.map((item) => item.subscriptionId), [items]);
  const { attemptsBySub } = useDigestSubscriptionDeliveryAttemptsQueries(subscriptionIds, args.refreshToken);
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const loading = subscriptionsQuery.isLoading;
  const queryFailure = subscriptionsQuery.isError ? toApiLoadFailure(subscriptionsQuery.error) : null;

  useEffect(() => {
    if (args.refreshToken === 0) {
      return;
    }

    void subscriptionsQuery.refetch();
  }, [args.refreshToken, subscriptionsQuery.refetch]);

  function rememberSubscription(subscriptionId: string): void {
    writeDigestSubscriptionLastViewedId(subscriptionId);
  }

  async function onViewHistory(subscriptionId: string): Promise<void> {
    rememberSubscription(subscriptionId);
    setListFailure(null);

    try {
      await queryClient.fetchQuery({
        queryKey: operatorQueryKeys.digestSubscriptionDeliveryAttempts(
          scope,
          subscriptionId,
          args.refreshToken,
        ),
        queryFn: () => listSubscriptionDeliveryAttempts(subscriptionId, DIGEST_SUBSCRIPTION_ATTEMPTS_TAKE),
      });
      setHistoryOpenFor((current) => (current === subscriptionId ? null : subscriptionId));
    } catch (error) {
      setListFailure(toApiLoadFailure(error));
    }
  }

  function openSubscription(subscriptionId: string): void {
    rememberSubscription(subscriptionId);
    document
      .querySelector(`[data-digest-subscription-id="${subscriptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (historyOpenFor !== subscriptionId) {
      void onViewHistory(subscriptionId);
    }
  }

  return {
    items,
    continueLastSubscription,
    attemptsBySub,
    historyOpenFor,
    loading,
    queryFailure,
    listFailure,
    subscriptionsQuery,
    rememberSubscription,
    onViewHistory,
    openSubscription,
  };
}
