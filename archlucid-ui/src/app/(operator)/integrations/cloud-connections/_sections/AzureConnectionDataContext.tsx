"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  listTier2Connections,
  validateTier2ConnectionHostedRun,
  type Tier2ConnectionResponse,
} from "@/lib/api/cloud-connections-api";
import {
  AZURE_CONNECTION_LOAD_FAILED_ERROR,
  AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR,
  formatAzureConnectionValidationSuccessMessage,
} from "@/lib/azure-cloud-connection-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { sanitizeHostedAzureValidationError } from "@/lib/sanitize-hosted-azure-validation-error";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";

import { parseFirstTier2SubscriptionId } from "./tier2-connection-field-validation";

export type AzureConnectionDataContextValue = {
  readonly connections: Tier2ConnectionResponse[];
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly formError: string | null;
  readonly actionMessage: string | null;
  readonly validatingConnectionId: string | null;
  readonly canMutate: boolean;
  readonly canRunValidation: boolean;
  readonly refreshConnections: () => Promise<void>;
  readonly setFormError: (message: string | null) => void;
  readonly setActionMessage: (message: string | null) => void;
  readonly triggerValidate: (connection: Tier2ConnectionResponse) => Promise<void>;
};

const AzureConnectionDataContext = createContext<AzureConnectionDataContextValue | null>(null);

export function AzureConnectionDataProvider(props: { readonly children: ReactNode }): React.ReactElement {
  const canMutate = useOperateCapability();
  const canRunValidation = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [connections, setConnections] = useState<Tier2ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [validatingConnectionId, setValidatingConnectionId] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

  const refreshConnections = useCallback(async () => {
    const data = await listTier2Connections();
    setConnections(data);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (loadStartedRef.current) {
      return;
    }

    loadStartedRef.current = true;

    void (async () => {
      try {
        await refreshConnections();
      } catch (err) {
        console.error(err);
        setLoadError(AZURE_CONNECTION_LOAD_FAILED_ERROR);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshConnections]);

  const triggerValidate = useCallback(
    async (connection: Tier2ConnectionResponse) => {
      if (!canRunValidation) {
        return;
      }

      const subscriptionId = parseFirstTier2SubscriptionId(connection.subscriptionIds);

      if (subscriptionId === null) {
        setFormError("Enter at least one subscription ID before validating.");
        setActionMessage(null);

        return;
      }

      setActionMessage(null);
      setFormError(null);
      setValidatingConnectionId(connection.connectionId);

      try {
        const result = await validateTier2ConnectionHostedRun({ subscriptionId });
        await refreshConnections();
        setActionMessage(formatAzureConnectionValidationSuccessMessage(result.resourceCount, result.packageId));
      } catch (err) {
        console.error(err);
        const sanitized = sanitizeHostedAzureValidationError(err);
        setFormError(sanitized.message || AZURE_CONNECTION_VALIDATION_FALLBACK_ERROR);
      } finally {
        setValidatingConnectionId(null);
      }
    },
    [canRunValidation, refreshConnections],
  );

  const value = useMemo<AzureConnectionDataContextValue>(
    () => ({
      connections,
      isLoading,
      loadError,
      formError,
      actionMessage,
      validatingConnectionId,
      canMutate,
      canRunValidation,
      refreshConnections,
      setFormError,
      setActionMessage,
      triggerValidate,
    }),
    [
      actionMessage,
      canMutate,
      canRunValidation,
      connections,
      formError,
      isLoading,
      loadError,
      refreshConnections,
      triggerValidate,
      validatingConnectionId,
    ],
  );

  return <AzureConnectionDataContext.Provider value={value}>{props.children}</AzureConnectionDataContext.Provider>;
}

export function useAzureConnectionData(): AzureConnectionDataContextValue {
  const context = useContext(AzureConnectionDataContext);

  if (context === null) {
    throw new Error("useAzureConnectionData must be used within AzureConnectionDataProvider");
  }

  return context;
}
