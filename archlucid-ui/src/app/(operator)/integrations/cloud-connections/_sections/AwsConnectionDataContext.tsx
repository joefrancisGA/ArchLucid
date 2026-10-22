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
  AwsTier2ConnectionResponse,
  listAwsTier2Connections,
  triggerAwsTier2HostedRun,
} from "@/lib/api/aws-cloud-connections-api";
import {
  AWS_CONNECTION_COLLECTION_FAILED_ERROR,
  AWS_CONNECTION_LOAD_FAILED_ERROR,
  formatAwsConnectionCollectionSuccessMessage,
} from "@/lib/aws-cloud-connection-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";

/**
 * Which section owns the current feedback message. Save, disconnect, and the connection-list
 * re-poll belong to "connection"; the Validate connection panel's re-poll belongs to "collection".
 * Panels render only their own scope so a single action never prints twice on the page.
 */
export type AwsConnectionMessageScope = "connection" | "collection";

export type AwsConnectionDataContextValue = {
  readonly connections: AwsTier2ConnectionResponse[];
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly formError: string | null;
  readonly actionMessage: string | null;
  readonly messageScope: AwsConnectionMessageScope | null;
  readonly pollingConnectionId: string | null;
  readonly canMutate: boolean;
  readonly refreshConnections: () => Promise<void>;
  readonly setFormError: (message: string | null, scope: AwsConnectionMessageScope) => void;
  readonly setActionMessage: (message: string | null, scope: AwsConnectionMessageScope) => void;
  readonly triggerRePoll: (
    connection: AwsTier2ConnectionResponse,
    scope: AwsConnectionMessageScope,
  ) => Promise<void>;
};

const AwsConnectionDataContext = createContext<AwsConnectionDataContextValue | null>(null);

export function AwsConnectionDataProvider(props: { readonly children: ReactNode }): React.ReactElement {
  const canMutate = useOperateCapability();
  const [connections, setConnections] = useState<AwsTier2ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormErrorState] = useState<string | null>(null);
  const [actionMessage, setActionMessageState] = useState<string | null>(null);
  const [messageScope, setMessageScope] = useState<AwsConnectionMessageScope | null>(null);
  const [pollingConnectionId, setPollingConnectionId] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

  const setFormError = useCallback((message: string | null, scope: AwsConnectionMessageScope) => {
    setFormErrorState(message);
    setMessageScope(message === null ? null : scope);
  }, []);

  const setActionMessage = useCallback((message: string | null, scope: AwsConnectionMessageScope) => {
    setActionMessageState(message);
    setMessageScope(message === null ? null : scope);
  }, []);

  const refreshConnections = useCallback(async () => {
    const data = await listAwsTier2Connections();
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
        setLoadError(AWS_CONNECTION_LOAD_FAILED_ERROR);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshConnections]);

  const triggerRePoll = useCallback(
    async (connection: AwsTier2ConnectionResponse, scope: AwsConnectionMessageScope) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null, scope);
      setFormError(null, scope);
      setPollingConnectionId(connection.connectionId);

      try {
        const result = await triggerAwsTier2HostedRun({ connectionId: connection.connectionId });
        await refreshConnections();
        setActionMessage(
          formatAwsConnectionCollectionSuccessMessage(result.resourceCount, result.packageId),
          scope,
        );
      } catch (err) {
        console.error(err);
        setFormError(AWS_CONNECTION_COLLECTION_FAILED_ERROR, scope);
      } finally {
        setPollingConnectionId(null);
      }
    },
    [canMutate, refreshConnections, setActionMessage, setFormError],
  );

  const value = useMemo<AwsConnectionDataContextValue>(
    () => ({
      connections,
      isLoading,
      loadError,
      formError,
      actionMessage,
      messageScope,
      pollingConnectionId,
      canMutate,
      refreshConnections,
      setFormError,
      setActionMessage,
      triggerRePoll,
    }),
    [
      actionMessage,
      canMutate,
      connections,
      formError,
      isLoading,
      loadError,
      messageScope,
      pollingConnectionId,
      refreshConnections,
      setActionMessage,
      setFormError,
      triggerRePoll,
    ],
  );

  return <AwsConnectionDataContext.Provider value={value}>{props.children}</AwsConnectionDataContext.Provider>;
}

export function useAwsConnectionData(): AwsConnectionDataContextValue {
  const context = useContext(AwsConnectionDataContext);

  if (context === null) {
    throw new Error("useAwsConnectionData must be used within AwsConnectionDataProvider");
  }

  return context;
}
