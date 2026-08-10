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
  GcpTier2ConnectionResponse,
  listGcpTier2Connections,
  triggerGcpTier2HostedRun,
} from "@/lib/api/gcp-cloud-connections-api";
import {
  formatGcpConnectionCollectionSuccessMessage,
  GCP_CONNECTION_COLLECTION_FAILED_ERROR,
} from "@/lib/gcp-cloud-connection-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";

export type GcpConnectionDataContextValue = {
  readonly connections: GcpTier2ConnectionResponse[];
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly formError: string | null;
  readonly actionMessage: string | null;
  readonly pollingConnectionId: string | null;
  readonly canMutate: boolean;
  readonly refreshConnections: () => Promise<void>;
  readonly setFormError: (message: string | null) => void;
  readonly setActionMessage: (message: string | null) => void;
  readonly triggerRePoll: (connection: GcpTier2ConnectionResponse) => Promise<void>;
};

const GcpConnectionDataContext = createContext<GcpConnectionDataContextValue | null>(null);

export function GcpConnectionDataProvider(props: { readonly children: ReactNode }): React.ReactElement {
  const canMutate = useOperateCapability();
  const [connections, setConnections] = useState<GcpTier2ConnectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pollingConnectionId, setPollingConnectionId] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

  const refreshConnections = useCallback(async () => {
    const data = await listGcpTier2Connections();
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
        setLoadError("Could not load GCP connections. Check your permissions and try again.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshConnections]);

  const triggerRePoll = useCallback(
    async (connection: GcpTier2ConnectionResponse) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null);
      setFormError(null);
      setPollingConnectionId(connection.connectionId);

      try {
        const result = await triggerGcpTier2HostedRun({ connectionId: connection.connectionId });
        await refreshConnections();
        setActionMessage(formatGcpConnectionCollectionSuccessMessage(result.resourceCount, result.packageId));
      } catch (err) {
        console.error(err);
        setFormError(GCP_CONNECTION_COLLECTION_FAILED_ERROR);
      } finally {
        setPollingConnectionId(null);
      }
    },
    [canMutate, refreshConnections],
  );

  const value = useMemo<GcpConnectionDataContextValue>(
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

  return <GcpConnectionDataContext.Provider value={value}>{props.children}</GcpConnectionDataContext.Provider>;
}

export function useGcpConnectionData(): GcpConnectionDataContextValue {
  const context = useContext(GcpConnectionDataContext);

  if (context === null) {
    throw new Error("useGcpConnectionData must be used within GcpConnectionDataProvider");
  }

  return context;
}
