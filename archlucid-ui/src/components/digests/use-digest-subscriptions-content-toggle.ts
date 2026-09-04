"use client";

import { useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { toggleDigestSubscription } from "@/lib/api";
import type { useDigestSubscriptionsContentList } from "@/components/digests/use-digest-subscriptions-content-list";

export type UseDigestSubscriptionsContentToggleArgs = {
  readonly list: Pick<
    ReturnType<typeof useDigestSubscriptionsContentList>,
    "subscriptionsQuery" | "rememberSubscription"
  >;
};

export function useDigestSubscriptionsContentToggle(args: UseDigestSubscriptionsContentToggleArgs) {
  const canMutateSubscriptions: boolean = useOperateCapability();
  const [mutating, setMutating] = useState<boolean>(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [pendingPause, setPendingPause] = useState<{
    subscriptionId: string;
    subscriptionName: string;
  } | null>(null);

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
