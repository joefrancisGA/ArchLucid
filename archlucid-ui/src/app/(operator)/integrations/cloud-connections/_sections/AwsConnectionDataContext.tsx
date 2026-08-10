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
  formatAwsConnectionCollectionSuccessMessage,
} from "@/lib/aws-cloud-connection-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";

export type AwsConnectionDataContextValue = {
  readonly connections: AwsTier2ConnectionResponse[];
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly formError: string | null;
  readonly actionMessage: string | null;
  readonly pollingConnectionId: string | null;
  readonly canMutate: boolean;
  readonly refreshConnections: () => Promise<void>;
  readonly setFormError: (message: string | null) => void;
  readonly setActionMessage: (message: string | null) => void;
  readonly triggerRePoll: (connection: AwsTier2ConnectionResponse) => Promise<void>;
};

const AwsConnectionDataContext = createContext<AwsConnectionDataContextValue | null>(null);

export function AwsConnectionDataProvider(props: { readonly children: ReactNode }): React.ReactElement {
  const canMutate = useOperateCapability();
  const [connections, setConnections] = useState<AwsTier2ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pollingConnectionId, setPollingConnectionId] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

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
        setLoadError("Could not load AWS connections. Check your permissions and try again.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshConnections]);

  const triggerRePoll = useCallback(
    async (connection: AwsTier2ConnectionResponse) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null);
      setFormError(null);
      setPollingConnectionId(connection.connectionId);

      try {
        const result = await triggerAwsTier2HostedRun({ connectionId: connection.connectionId });
        await refreshConnections();
        setActionMessage(formatAwsConnectionCollectionSuccessMessage(result.resourceCount, result.packageId));
      } catch (err) {
        console.error(err);
        setFormError(AWS_CONNECTION_COLLECTION_FAILED_ERROR);
      } finally {
        setPollingConnectionId(null);
      }
    },
    [canMutate, refreshConnections],
  );

  const value = useMemo<AwsConnectionDataContextValue>(
    () => ({
      connections,
      isLoading,
      loadError,
      formError,
      actionMessage,
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
      pollingConnectionId,
      refreshConnections,
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
