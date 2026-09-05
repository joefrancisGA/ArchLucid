"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createDigestSubscription } from "@/lib/api";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import {
  digestSubscriptionsPanelsHrefFromSearch,
  parseDigestSubscriptionsCreatePanelFromSearch,
} from "@/lib/digests/digest-subscriptions-panels-url";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import type { useDigestSubscriptionsContentList } from "@/components/digests/use-digest-subscriptions-content-list";

export type UseDigestSubscriptionsContentCreateArgs = {
  readonly list: Pick<
    ReturnType<typeof useDigestSubscriptionsContentList>,
    "items" | "subscriptionsQuery" | "rememberSubscription"
  >;
  readonly formCardRef: RefObject<HTMLDivElement | null>;
};

export function useDigestSubscriptionsContentCreate(args: UseDigestSubscriptionsContentCreateArgs) {
  const router = useRouter();
  const pathname = usePathname() ?? DIGESTS_HUB_PATH;
  const searchParams = useSearchParams();
  const urlShowCreate = parseDigestSubscriptionsCreatePanelFromSearch(searchParams.get("create"));
  const canMutateSubscriptions: boolean = useOperateCapability();
  const [creating, setCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const [prefillFrom, setPrefillFrom] = useState<DigestSubscription | null>(null);
  const [formResetKey, setFormResetKey] = useState<number>(0);
  const [focusCreateToken, setFocusCreateToken] = useState<number>(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncCreatePanelToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        digestSubscriptionsPanelsHrefFromSearch(searchParams.toString(), { showCreatePanel: open }, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!urlShowCreate) {
      return;
    }

    setPrefillFrom(null);
    setFocusCreateToken((value) => value + 1);
    args.formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [args.formCardRef, urlShowCreate]);

  async function onCreate(input: {
    name: string;
    channelType: string;
    destination: string;
    digestType: string;
    isEnabled: boolean;
  }): Promise<void> {
    if (!canMutateSubscriptions || creating) {
      return;
    }

    setCreating(true);
    setCreateSuccess(false);
    setMutationFailure(null);

    try {
      await createDigestSubscription({
        name: input.name,
        channelType: input.channelType,
        destination: input.destination,
        isEnabled: input.isEnabled,
        metadataJson: JSON.stringify({ digestType: input.digestType }),
      });
      setCreateSuccess(true);

      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = setTimeout(() => {
        setCreateSuccess(false);
      }, 4000);

      await args.list.subscriptionsQuery.refetch();
      setMutationFailure(null);
      setPrefillFrom(null);
      setFormResetKey((value) => value + 1);
    } catch (error) {
      setMutationFailure(toApiLoadFailure(error));
    } finally {
      setCreating(false);
    }
  }

  function focusCreateForm(): void {
    setPrefillFrom(null);
    setFocusCreateToken((value) => value + 1);
    args.formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    syncCreatePanelToUrl(true);
  }

  function onPrefillCreate(subscription: DigestSubscription): void {
    args.list.rememberSubscription(subscription.subscriptionId);
    setPrefillFrom(subscription);
    args.formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return {
    canMutateSubscriptions,
    creating,
    createSuccess,
    mutationFailure,
    prefillFrom,
    formResetKey,
    focusCreateToken,
    onCreate,
    focusCreateForm,
    onPrefillCreate,
  };
}
