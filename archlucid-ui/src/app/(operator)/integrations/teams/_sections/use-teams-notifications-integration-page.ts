"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  deleteTeamsIncomingWebhookConnection,
  getTeamsIncomingWebhookConnection,
  getTeamsNotificationTriggerCatalog,
  testTeamsIncomingWebhookConnection,
  upsertTeamsIncomingWebhookConnection,
  validateTeamsIncomingWebhookSecret,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  TEAMS_NOTIFICATION_EVENT_TYPES,
  TEAMS_RECOMMENDED_EVENT_TYPES,
} from "@/lib/teams-integration-notification-catalog";
import {
  TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE,
  TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  resolveTeamsIntegrationConnectionStatus,
  TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
  TEAMS_INTEGRATION_TEST_FAILURE,
  TEAMS_INTEGRATION_TEST_SUCCESS,
} from "@/lib/teams-integration-page-copy";
import {
  mapTeamsSecretValidationApiOutcome,
  validateTeamsKeyVaultSecretNameClient,
  type TeamsSecretValidationResult,
} from "@/lib/teams-integration-secret-validation";
import type {
  TeamsIncomingWebhookConnectionResponse,
  TeamsIncomingWebhookConnectionUpsertRequest,
} from "@/types/teams-incoming-webhook-connection";

import type { TeamsNotificationsIntegrationPageServerLoad } from "./load-teams-notifications-integration-page-data";
import type { TeamsNotificationsIntegrationPageViewModel } from "./teams-notifications-integration-view-model";

const SAVE_FAILURE_MESSAGE = "We could not save this Teams connection. Check the fields and try again.";

function seedFormFields(
  connection: TeamsIncomingWebhookConnectionResponse | null,
  catalog: string[],
): { secretName: string; label: string; enabledTriggers: Set<string> } {
  if (connection === null || !connection.isConfigured) {
    // Leave triggers unchecked until the operator picks Select recommended / Save (TB-1175).
    return {
      secretName: connection?.keyVaultSecretName ?? "",
      label: connection?.label ?? "",
      enabledTriggers: new Set(),
    };
  }

  return {
    secretName: connection.keyVaultSecretName ?? "",
    label: connection.label ?? "",
    enabledTriggers: new Set(connection.enabledTriggers ?? catalog),
  };
}

export function useTeamsNotificationsIntegrationPage(
  serverLoad: TeamsNotificationsIntegrationPageServerLoad,
): TeamsNotificationsIntegrationPageViewModel {
  const isDemo = serverLoad.mode === "demo";
  const canMutate = useOperateCapability();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRemoveConfirm, setPendingRemoveConfirm] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testing, setTesting] = useState(false);

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
  const [enabledTriggers, setEnabledTriggers] = useState<Set<string>>(
    () => liveSeed?.form.enabledTriggers ?? new Set(),
  );
  const [secretValidation, setSecretValidation] = useState<TeamsSecretValidationResult | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testKind, setTestKind] = useState<"success" | "error" | null>(null);
  const [showTriggerValidationError, setShowTriggerValidationError] = useState(false);
  const [lastTestMessage, setLastTestMessage] = useState<string | null>(null);
  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);

  const skipInitialClientLoadRef = useRef(serverLoad.mode === "live");

  const connectionStatus = useMemo(
    () =>
      resolveTeamsIntegrationConnectionStatus({
        isConfigured: conn?.isConfigured === true,
        enabledTriggerCount: conn?.enabledTriggers?.length ?? 0,
        hasConnectionIssue: failure !== null || secretValidation?.outcome === "permission-denied",
      }),
    [conn, failure, secretValidation],
  );

  const canSendTest = useMemo(() => {
    if (secretName.trim().length === 0) {
      return false;
    }

    return secretValidation?.outcome === "valid";
  }, [secretName, secretValidation]);

  const load = useCallback(async (): Promise<void> => {
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
      setEnabledTriggers(
        new Set(data.isConfigured ? (data.enabledTriggers ?? triggers) : []),
      );
    } catch (error) {
      setFailure(toApiLoadFailure(error));
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

  useEffect(() => {
    setSecretValidation(null);
    setTestMessage(null);
    setTestKind(null);
  }, [secretName]);

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
    setShowTriggerValidationError(false);
  }, []);

  const onSelectRecommended = useCallback(() => {
    setEnabledTriggers(new Set(TEAMS_RECOMMENDED_EVENT_TYPES));
    setShowTriggerValidationError(false);
  }, []);

  const onSelectAll = useCallback(() => {
    setEnabledTriggers(new Set(catalog.length > 0 ? catalog : TEAMS_NOTIFICATION_EVENT_TYPES));
    setShowTriggerValidationError(false);
  }, [catalog]);

  const onClearAll = useCallback(() => {
    setEnabledTriggers(new Set());
    setShowTriggerValidationError(false);
  }, []);

  const onValidateSecret = useCallback(async (): Promise<void> => {
    const clientResult = validateTeamsKeyVaultSecretNameClient(secretName);

    if (clientResult.outcome !== "valid") {
      setSecretValidation(clientResult);

      return;
    }

    setValidating(true);
    setSecretValidation(null);

    try {
      const response = await validateTeamsIncomingWebhookSecret(secretName.trim());
      setSecretValidation(mapTeamsSecretValidationApiOutcome(response.outcome));
    } catch {
      setSecretValidation({
        outcome: "permission-denied",
        message: TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE,
      });
    } finally {
      setValidating(false);
    }
  }, [secretName]);

  const onSendTest = useCallback(async (): Promise<void> => {
    if (!canSendTest) {
      return;
    }

    setTesting(true);
    setTestMessage(null);
    setTestKind(null);

    try {
      const response = await testTeamsIncomingWebhookConnection(secretName.trim());
      const success = response.delivered === true;

      setTestKind(success ? "success" : "error");
      setTestMessage(success ? TEAMS_INTEGRATION_TEST_SUCCESS : response.message ?? TEAMS_INTEGRATION_TEST_FAILURE);

      if (success) {
        setLastTestMessage(TEAMS_INTEGRATION_TEST_SUCCESS);
      }
    } catch {
      setTestKind("error");
      setTestMessage(TEAMS_INTEGRATION_TEST_FAILURE);
    } finally {
      setTesting(false);
    }
  }, [canSendTest, secretName]);

  const onSave = useCallback(async (): Promise<void> => {
    if (!canMutate) {
      return;
    }

    const clientResult = validateTeamsKeyVaultSecretNameClient(secretName);

    if (clientResult.outcome !== "valid") {
      setSecretValidation(clientResult);

      return;
    }

    if (enabledTriggers.size === 0) {
      setShowTriggerValidationError(true);

      return;
    }

    setSaving(true);
    setFailure(null);
    setShowTriggerValidationError(false);
    setMutationSuccessMessage(null);

    try {
      const orderedTriggers = (catalog.length > 0 ? catalog : TEAMS_NOTIFICATION_EVENT_TYPES).filter((eventType) =>
        enabledTriggers.has(eventType),
      );
      const body: TeamsIncomingWebhookConnectionUpsertRequest = {
        keyVaultSecretName: secretName.trim(),
        label: label.trim().length > 0 ? label.trim() : null,
        enabledTriggers: orderedTriggers,
      };
      const saved = await upsertTeamsIncomingWebhookConnection(body);

      setConn(saved);
      setEnabledTriggers(new Set(saved.enabledTriggers));
      setMutationSuccessMessage(TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE);
    } catch {
      setFailure({
        message: SAVE_FAILURE_MESSAGE,
        problem: null,
        correlationId: null,
        httpStatus: null,
        retryAfterSeconds: null,
      });
    } finally {
      setSaving(false);
    }
  }, [canMutate, catalog, enabledTriggers, label, secretName]);

  const requestRemove = useCallback((): void => {
    if (!canMutate) {
      return;
    }

    setPendingRemoveConfirm(true);
  }, [canMutate]);

  const cancelRemove = useCallback((): void => {
    if (saving) {
      return;
    }

    setPendingRemoveConfirm(false);
  }, [saving]);

  const confirmRemove = useCallback(async (): Promise<void> => {
    if (!canMutate) {
      return;
    }

    setSaving(true);
    setFailure(null);
    setMutationSuccessMessage(null);

    try {
      await deleteTeamsIncomingWebhookConnection();
      setConn(null);
      setSecretName("");
      setLabel("");
      setEnabledTriggers(new Set());
      setSecretValidation(null);
      setTestMessage(null);
      setTestKind(null);
      setLastTestMessage(null);
      await load();
      setMutationSuccessMessage(TEAMS_INTEGRATION_REMOVE_SUCCESS_MESSAGE);
      setPendingRemoveConfirm(false);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setSaving(false);
    }
  }, [canMutate, load]);

  return {
    isDemo,
    canMutate,
    loading,
    saving,
    validating,
    testing,
    failure,
    conn,
    connectionStatus,
    secretName,
    setSecretName,
    label,
    setLabel,
    catalog,
    enabledTriggers,
    secretValidation,
    testMessage,
    testKind,
    lastTestMessage,
    showTriggerValidationError,
    mutationSuccessMessage,
    setMutationSuccessMessage,
    canSendTest,
    toggleTrigger,
    onSelectRecommended,
    onSelectAll,
    onClearAll,
    onValidateSecret,
    onSendTest,
    onSave,
    pendingRemoveConfirm,
    requestRemove,
    cancelRemove,
    confirmRemove,
  };
}
