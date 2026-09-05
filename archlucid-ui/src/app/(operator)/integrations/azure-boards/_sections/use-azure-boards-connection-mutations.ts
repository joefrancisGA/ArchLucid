"use client";

import { useCallback, useState } from "react";

import { upsertAzureBoardsSettings } from "@/lib/api/azure-boards-api";
import {
  upsertTenantItsmConnectorConnection,
  type TenantItsmConnectorConnectionResponse,
} from "@/lib/api/itsm-outbound-api";
import {
  isAzureBoardsConnectionSaveSuccessful,
} from "@/lib/azure-boards-integration-present";
import { mapAzureBoardsHealthFromSettings } from "@/lib/azure-boards-stored-health";
import type { AzureBoardsIntegrationHealthResponse, AzureBoardsOutboundSettingsResponse } from "@/lib/api/azure-boards-api";

export type UseAzureBoardsConnectionMutationsOptions = {
  readonly canMutate: boolean;
  readonly organizationUrl: string;
  readonly tokenReference: string;
  readonly projectName: string;
  readonly workItemType: string;
  readonly areaPath: string;
  readonly iterationPath: string;
  readonly defaultTags: string;
  readonly connection: TenantItsmConnectorConnectionResponse | null;
  readonly applySettings: (loaded: AzureBoardsOutboundSettingsResponse | null) => void;
  readonly applyConnection: (loaded: TenantItsmConnectorConnectionResponse | null, preserveUserEdits?: boolean) => void;
  readonly setHealth: React.Dispatch<React.SetStateAction<AzureBoardsIntegrationHealthResponse | null>>;
  readonly loadDiscovery: () => Promise<void>;
};

export function useAzureBoardsConnectionMutations({
  canMutate,
  organizationUrl,
  tokenReference,
  projectName,
  workItemType,
  areaPath,
  iterationPath,
  defaultTags,
  connection,
  applySettings,
  applyConnection,
  setHealth,
  loadDiscovery,
}: UseAzureBoardsConnectionMutationsOptions) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionSaveError, setConnectionSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [connectionSaveSuccess, setConnectionSaveSuccess] = useState<string | null>(null);
  const [settingsLastSavedUtc, setSettingsLastSavedUtc] = useState<string | null>(null);
  const [settingsInlineSaveError, setSettingsInlineSaveError] = useState<string | null>(null);
  const [connectionLastSavedUtc, setConnectionLastSavedUtc] = useState<string | null>(null);
  const [connectionInlineSaveError, setConnectionInlineSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingConnection, setIsSavingConnection] = useState(false);

  const saveConnection = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setIsSavingConnection(true);
    setConnectionSaveError(null);
    setConnectionSaveSuccess(null);
    setConnectionInlineSaveError(null);

    try {
      const saved = await upsertTenantItsmConnectorConnection("azureboards", {
        instanceBaseUrl: organizationUrl.trim(),
        authMode: "BasicApiToken",
        authUserName: "",
        credentialKeyVaultSecretName: tokenReference.trim() || connection?.credentialKeyVaultSecretName || "",
        isEnabled: true,
      });
      applyConnection(saved);

      if (isAzureBoardsConnectionSaveSuccessful(saved)) {
        setConnectionLastSavedUtc(new Date().toISOString());
      }

      // New credentials are unvalidated until the operator runs Test connection.
      setHealth(
        mapAzureBoardsHealthFromSettings(isAzureBoardsConnectionSaveSuccessful(saved), {
          lastConnectionTestUtc: null,
          lastConnectionTestSummary: null,
        }),
      );
      await loadDiscovery();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save connection.";
      setConnectionSaveError(message);
      setConnectionInlineSaveError(message);
    } finally {
      setIsSavingConnection(false);
    }
  }, [
    applyConnection,
    canMutate,
    connection?.credentialKeyVaultSecretName,
    loadDiscovery,
    organizationUrl,
    setHealth,
    tokenReference,
  ]);

  const saveSettings = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    setSettingsInlineSaveError(null);

    try {
      const saved = await upsertAzureBoardsSettings({
        projectName: projectName.trim(),
        defaultWorkItemType: workItemType.trim(),
        areaPath: areaPath.trim() || null,
        iterationPath: iterationPath.trim() || null,
        defaultTags: defaultTags.trim() || null,
      });
      applySettings(saved);
      setSettingsLastSavedUtc(new Date().toISOString());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save work item settings.";
      setSaveError(message);
      setSettingsInlineSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    applySettings,
    areaPath,
    canMutate,
    defaultTags,
    iterationPath,
    projectName,
    workItemType,
  ]);

  return {
    saveError,
    connectionSaveError,
    saveSuccess,
    connectionSaveSuccess,
    settingsLastSavedUtc,
    settingsInlineSaveError,
    connectionLastSavedUtc,
    connectionInlineSaveError,
    isSaving,
    isSavingConnection,
    saveConnection,
    saveSettings,
  };
}
