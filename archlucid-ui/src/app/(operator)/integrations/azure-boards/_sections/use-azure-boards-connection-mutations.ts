"use client";

import { useCallback, useState } from "react";

import type {
  AzureBoardsIntegrationHealthResponse,
  AzureBoardsOutboundSettingsResponse,
} from "@/lib/api/azure-boards-api";
import {
  type TenantItsmConnectorConnectionResponse,
} from "@/lib/api/itsm-outbound-api";
import { isLivelihoodMutation401RedirectError } from "@/lib/auth/livelihood-mutation-401-resume";
import { saveItsmConnectorWith401Resume } from "@/lib/auth/livelihood-mutation-401-resume-wrappers";
import {
  isAzureBoardsConnectionSaveSuccessful,
} from "@/lib/azure-boards-integration-present";
import { mapAzureBoardsHealthFromSettings } from "@/lib/azure-boards-stored-health";

export type UseAzureBoardsConnectionMutationsOptions = {
  readonly livelihoodReturnPath: string;
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
  livelihoodReturnPath,
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
      const saved = await saveItsmConnectorWith401Resume(
        {
          connector: "azureboards_connection",
          body: {
            instanceBaseUrl: organizationUrl.trim(),
            authMode: "BasicApiToken",
            authUserName: "",
            credentialKeyVaultSecretName:
              tokenReference.trim() || connection?.credentialKeyVaultSecretName || "",
            isEnabled: true,
          },
        },
        { returnPath: livelihoodReturnPath },
      ) as TenantItsmConnectorConnectionResponse;
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
      if (isLivelihoodMutation401RedirectError(error)) {
        return;
      }

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
    livelihoodReturnPath,
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
      const saved = await saveItsmConnectorWith401Resume(
        {
          connector: "azureboards_settings",
          body: {
            projectName: projectName.trim(),
            defaultWorkItemType: workItemType.trim(),
            areaPath: areaPath.trim() || null,
            iterationPath: iterationPath.trim() || null,
            defaultTags: defaultTags.trim() || null,
          },
        },
        { returnPath: livelihoodReturnPath },
      ) as AzureBoardsOutboundSettingsResponse;
      applySettings(saved);
      setSettingsLastSavedUtc(new Date().toISOString());
    } catch (error: unknown) {
      if (isLivelihoodMutation401RedirectError(error)) {
        return;
      }

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
    livelihoodReturnPath,
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
