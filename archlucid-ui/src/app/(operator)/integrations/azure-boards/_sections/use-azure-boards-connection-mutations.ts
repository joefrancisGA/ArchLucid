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
import {
  AZURE_BOARDS_CONNECTION_SAVE_SUCCESS,
  AZURE_BOARDS_SAVE_SUCCESS,
} from "@/lib/azure-boards-page-copy";
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

export function useAzureBoardsConnectionMutations(options: UseAzureBoardsConnectionMutationsOptions) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [connectionSaveError, setConnectionSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [connectionSaveSuccess, setConnectionSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingConnection, setIsSavingConnection] = useState(false);

  const saveConnection = useCallback(async () => {
    if (!options.canMutate) {
      return;
    }

    setIsSavingConnection(true);
    setConnectionSaveError(null);
    setConnectionSaveSuccess(null);

    try {
      const saved = await upsertTenantItsmConnectorConnection("azureboards", {
        instanceBaseUrl: options.organizationUrl.trim(),
        authMode: "BasicApiToken",
        authUserName: "",
        credentialKeyVaultSecretName: options.tokenReference.trim() || options.connection?.credentialKeyVaultSecretName || "",
        isEnabled: true,
      });
      options.applyConnection(saved);
      if (isAzureBoardsConnectionSaveSuccessful(saved)) {
        setConnectionSaveSuccess(AZURE_BOARDS_CONNECTION_SAVE_SUCCESS);
      }

      // New credentials are unvalidated until the operator runs Test connection.
      options.setHealth(
        mapAzureBoardsHealthFromSettings(isAzureBoardsConnectionSaveSuccessful(saved), {
          lastConnectionTestUtc: null,
          lastConnectionTestSummary: null,
        }),
      );
      await options.loadDiscovery();
    } catch (error: unknown) {
      setConnectionSaveError(error instanceof Error ? error.message : "Could not save connection.");
    } finally {
      setIsSavingConnection(false);
    }
  }, [options]);

  const saveSettings = useCallback(async () => {
    if (!options.canMutate) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const saved = await upsertAzureBoardsSettings({
        projectName: options.projectName.trim(),
        defaultWorkItemType: options.workItemType.trim(),
        areaPath: options.areaPath.trim() || null,
        iterationPath: options.iterationPath.trim() || null,
        defaultTags: options.defaultTags.trim() || null,
      });
      options.applySettings(saved);
      setSaveSuccess(AZURE_BOARDS_SAVE_SUCCESS);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Could not save work item settings.");
    } finally {
      setIsSaving(false);
    }
  }, [options]);

  return {
    saveError,
    connectionSaveError,
    saveSuccess,
    connectionSaveSuccess,
    isSaving,
    isSavingConnection,
    saveConnection,
    saveSettings,
  };
}
