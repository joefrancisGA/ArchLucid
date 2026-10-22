"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { toggleDigestSubscription } from "@/lib/api";
import type { useDigestSubscriptionsContentList } from "@/components/digests/use-digest-subscriptions-content-list";
import {
  digestSubscriptionsPanelsHrefFromSearch,
  parseDigestSubscriptionsPauseIdFromSearch,
} from "@/lib/digests/digest-subscriptions-panels-url";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";

export type UseDigestSubscriptionsContentToggleArgs = {
  readonly list: Pick<
    ReturnType<typeof useDigestSubscriptionsContentList>,
    "subscriptionsQuery" | "rememberSubscription" | "items"
  >;
};

export function useDigestSubscriptionsContentToggle(args: UseDigestSubscriptionsContentToggleArgs) {
  const router = useRouter();
  const pathname = usePathname() ?? DIGESTS_HUB_PATH;
  const searchParams = useSearchParams();
  const urlPauseId = parseDigestSubscriptionsPauseIdFromSearch(searchParams.get("pauseSubId"));
  const canMutateSubscriptions: boolean = useOperateCapability();
  const [mutating, setMutating] = useState<boolean>(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [pendingPause, setPendingPauseState] = useState<{
    subscriptionId: string;
    subscriptionName: string;
  } | null>(null);

  const syncPauseToUrl = useCallback(
    (subscriptionId: string | null) => {
      router.replace(
        digestSubscriptionsPanelsHrefFromSearch(
          searchParams.toString(),
          { pauseSubscriptionId: subscriptionId },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingPause = useCallback(
    (value: { subscriptionId: string; subscriptionName: string } | null) => {
      setPendingPauseState(value);
      syncPauseToUrl(value?.subscriptionId ?? null);
    },
    [syncPauseToUrl],
  );

  useEffect(() => {
    if (urlPauseId.length === 0) {
      if (pendingPause !== null) {
        setPendingPauseState(null);
      }

      return;
    }

    if (args.list.items.length === 0) {
      return;
    }

    const subscription = args.list.items.find((row) => row.subscriptionId === urlPauseId);

    if (subscription === undefined) {
      return;
    }

    if (pendingPause?.subscriptionId === urlPauseId) {
      return;
    }

    setPendingPauseState({
      subscriptionId: subscription.subscriptionId,
      subscriptionName: subscription.name,
    });
  }, [args.list.items, pendingPause?.subscriptionId, urlPauseId]);

  async function executeToggle(subscriptionId: string): Promise<void> {
    setMutationFailure(null);
    setMutating(true);

    try {
      await toggleDigestSubscription(subscriptionId);
      await args.list.subscriptionsQuery.refetch();
      setMutationFailure(null);
    } catch (error) {
      setMutationFailure(toApiLoadFailure(error));
      throw error;
    } finally {
      setMutating(false);
    }
  }

  async function onToggle(
    subscriptionId: string,
    isEnabled: boolean,
    subscriptionName: string,
  ): Promise<void> {
    args.list.rememberSubscription(subscriptionId);

    if (!canMutateSubscriptions) {
      return;
    }

    if (isEnabled) {
      setPendingPause({ subscriptionId, subscriptionName });

      return;
    }

    await executeToggle(subscriptionId);
  }

  async function confirmPause(): Promise<void> {
    if (pendingPause === null || mutating) {
      return;
    }

    try {
      await executeToggle(pendingPause.subscriptionId);
      setPendingPause(null);
    } catch {
      // Failure is already on mutationFailure for the page alert.
    }
  }

  return {
    canMutateSubscriptions,
    mutating,
    mutationFailure,
    pendingPause,
    setPendingPause,
    onToggle,
    confirmPause,
  };
}
