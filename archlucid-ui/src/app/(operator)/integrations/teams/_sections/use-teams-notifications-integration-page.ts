"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  deleteTeamsIncomingWebhookConnection,
  getTeamsIncomingWebhookConnection,
  getTeamsNotificationTriggerCatalog,
  upsertTeamsIncomingWebhookConnection,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type {
  TeamsIncomingWebhookConnectionResponse,
  TeamsIncomingWebhookConnectionUpsertRequest,
} from "@/types/teams-incoming-webhook-connection";

import type { TeamsNotificationsIntegrationPageServerLoad } from "./load-teams-notifications-integration-page-data";
import type { TeamsNotificationsIntegrationPageViewModel } from "./teams-notifications-integration-view-model";

function seedFormFields(
  connection: TeamsIncomingWebhookConnectionResponse | null,
  triggers: string[],
): { secretName: string; label: string; enabledTriggers: Set<string> } {
  if (connection === null) {
    return { secretName: "", label: "", enabledTriggers: new Set() };
  }

  return {
    secretName: connection.keyVaultSecretName ?? "",
    label: connection.label ?? "",
    enabledTriggers: new Set(connection.enabledTriggers ?? triggers),
  };
}

export function useTeamsNotificationsIntegrationPage(
  serverLoad: TeamsNotificationsIntegrationPageServerLoad,
): TeamsNotificationsIntegrationPageViewModel {
  const isDemo = serverLoad.mode === "demo";

  const canMutate = useOperateCapability();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const liveSeed =
    serverLoad.mode === "live"
      ? {
          conn: serverLoad.conn,
          catalog: serverLoad.catalog,
          failure: serverLoad.failure,
          form: seedFormFields(serverLoad.conn, serverLoad.catalog),
        }
      : null;

  const [failure, setFailure] = useState<ApiLoadFailureState | null>(liveSeed?.failure ?? null);
  const [conn, setConn] = useState<TeamsIncomingWebhookConnectionResponse | null>(liveSeed?.conn ?? null);
  const [secretName, setSecretName] = useState(liveSeed?.form.secretName ?? "");
  const [label, setLabel] = useState(liveSeed?.form.label ?? "");
  const [catalog, setCatalog] = useState<string[]>(liveSeed?.catalog ?? []);
  const [enabledTriggers, setEnabledTriggers] = useState<Set<string>>(() => liveSeed?.form.enabledTriggers ?? new Set());

  const skipInitialClientLoadRef = useRef(serverLoad.mode === "live");

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

    if (skipInitialClientLoadRef.current) {
      skipInitialClientLoadRef.current = false;

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
