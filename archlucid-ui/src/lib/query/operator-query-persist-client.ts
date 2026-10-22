import type { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

import { shouldPersistOperatorQueryKey } from "@/lib/query/operator-query-persist-allowlist";
import {
  buildOperatorQueryPersistBuster,
  buildOperatorQueryPersistStorageKey,
  OPERATOR_QUERY_PERSIST_MAX_AGE_MS,
} from "@/lib/query/operator-query-persist-scope";

export function setupOperatorQueryClientPersistence(queryClient: QueryClient): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const persister = createSyncStoragePersister({
    storage: window.sessionStorage,
    key: buildOperatorQueryPersistStorageKey(),
  });

  const [unsubscribe] = persistQueryClient({
    queryClient,
    persister,
    maxAge: OPERATOR_QUERY_PERSIST_MAX_AGE_MS,
    buster: buildOperatorQueryPersistBuster(),
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && shouldPersistOperatorQueryKey(query.queryKey),
    },
  });

  return unsubscribe;
}
