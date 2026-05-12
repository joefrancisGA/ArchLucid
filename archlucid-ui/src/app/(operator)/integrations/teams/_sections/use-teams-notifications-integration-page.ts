"use client";

import { useCallback, useEffect, useState } from "react";

import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import {
  deleteTeamsIncomingWebhookConnection,
  getTeamsIncomingWebhookConnection,
  getTeamsNotificationTriggerCatalog,
  upsertTeamsIncomingWebhookConnection,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import type {
  TeamsIncomingWebhookConnectionResponse,
  TeamsIncomingWebhookConnectionUpsertRequest,
} from "@/types/teams-incoming-webhook-connection";

import type { TeamsNotificationsIntegrationPageViewModel } from "./teams-notifications-integration-view-model";

export function useTeamsNotificationsIntegrationPage(): TeamsNotificationsIntegrationPageViewModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const canMutate = useEnterpriseMutationCapability();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [conn, setConn] = useState<TeamsIncomingWebhookConnectionResponse | null>(null);
  const [secretName, setSecretName] = useState("");
  const [label, setLabel] = useState("");
  const [catalog, setCatalog] = useState<string[]>([]);
  const [enabledTriggers, setEnabledTriggers] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const [data, triggers] = await Promise.all([
        getTeamsIncomingWebhookConnection(),
        getTeamsNotificationTriggerCatalog(),
      ]);

      setConn(data);
      setSecretName(data.keyVaultSecretName ?? "");
      setLabel(data.label ?? "");
      setCatalog(triggers);
      setEnabledTriggers(new Set(data.enabledTriggers ?? triggers));
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void load();
  }, [isDemo, load]);

  const toggleTrigger = useCallback((eventType: string, checked: boolean) => {
    setEnabledTriggers((prev) => {
      const next = new Set(prev);

      if (checked) {
        next.add(eventType);
      } else {
        next.delete(eventType);
      }

      return next;
    });
  }, []);

  const onSave = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setSaving(true);
    setFailure(null);

    try {
      // Preserve the catalog ordering when sending so the diff in the audit log is deterministic.
      const orderedTriggers = catalog.filter((t) => enabledTriggers.has(t));
      const body: TeamsIncomingWebhookConnectionUpsertRequest = {
        keyVaultSecretName: secretName.trim(),
        label: label.trim().length > 0 ? label.trim() : null,
        enabledTriggers: orderedTriggers,
      };
      const saved = await upsertTeamsIncomingWebhookConnection(body);

      setConn(saved);
      setEnabledTriggers(new Set(saved.enabledTriggers));
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setSaving(false);
    }
  }, [canMutate, catalog, enabledTriggers, label, secretName]);

  const onRemove = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setSaving(true);
    setFailure(null);

    try {
      await deleteTeamsIncomingWebhookConnection();
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setSaving(false);
    }
  }, [canMutate, load]);

  return {
    isDemo,
    canMutate,
    loading,
    saving,
    failure,
    conn,
    secretName,
    setSecretName,
    label,
    setLabel,
    catalog,
    enabledTriggers,
    toggleTrigger,
    load,
    onSave,
    onRemove,
  };
}
