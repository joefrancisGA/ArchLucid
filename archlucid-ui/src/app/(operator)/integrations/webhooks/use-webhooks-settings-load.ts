"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { listAlertRoutingSubscriptions } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

function isGenericOutboundWebhookChannel(channelType: string): boolean {
  return channelType === "OnCallWebhook";
}

export type UseWebhooksSettingsLoadOptions = {
  readonly onScopeChange?: () => void;
};

export type UseWebhooksSettingsLoadResult = {
  readonly items: AlertRoutingSubscription[];
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly setFailure: React.Dispatch<React.SetStateAction<ApiLoadFailureState | null>>;
  readonly load: () => Promise<void>;
  readonly webhookRows: AlertRoutingSubscription[];
  readonly activeSubscriptionCount: number;
  readonly scopeGenerationRef: React.RefObject<number>;
  readonly resetScopeState: () => void;
};

export function useWebhooksSettingsLoad(
  options: UseWebhooksSettingsLoadOptions = {},
): UseWebhooksSettingsLoadResult {
  const scope = useOperatorScopeQueryKey();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const scopeKey = `${scope.tenantId}:${scope.workspaceId}:${scope.projectId}`;
  const previousScopeKeyRef = useRef(scopeKey);
  const scopeGenerationRef = useRef(0);

  const webhookRows = useMemo(
    () => items.filter((subscription) => isGenericOutboundWebhookChannel(subscription.channelType)),
    [items],
  );

  const activeSubscriptionCount = useMemo(
    () => webhookRows.filter((subscription) => subscription.isEnabled === true).length,
    [webhookRows],
  );

  const load = useCallback(async () => {
    const generation = scopeGenerationRef.current;
    setLoading(true);
    setFailure(null);

    try {
      const data = await listAlertRoutingSubscriptions();

      if (scopeGenerationRef.current !== generation) {
        return;
      }

      setItems(data);
    } catch (error: unknown) {
      if (scopeGenerationRef.current !== generation) {
        return;
      }

      setFailure(toApiLoadFailure(error));
    } finally {
      if (scopeGenerationRef.current === generation) {
        setLoading(false);
      }
    }
  }, []);

  const resetScopeState = useCallback(() => {
    setItems([]);
    setFailure(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (previousScopeKeyRef.current === scopeKey) {
      return;
    }

    previousScopeKeyRef.current = scopeKey;
    scopeGenerationRef.current += 1;
    resetScopeState();
    options.onScopeChange?.();
    void load();
  }, [scopeKey, resetScopeState, load, options.onScopeChange]);

  return {
    items,
    loading,
    failure,
    setFailure,
    load,
    webhookRows,
    activeSubscriptionCount,
    scopeGenerationRef,
    resetScopeState,
  };
}
