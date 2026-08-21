"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_CLOUD_PLATFORM_SCOPE,
  persistCloudPlatformScope,
  readCloudPlatformScopeFromStorage,
  resolveLandingCloudPlatformScope,
  subscribeCloudPlatformScopeChanges,
  syncCloudPlatformScopeFromServer,
  type CloudPlatformScope,
} from "@/lib/cloud-platform-scope-storage";

export type CloudPlatformScopeAccountSyncState = "idle" | "synced" | "local-only";

export function useCloudPlatformScope(): {
  readonly scope: CloudPlatformScope;
  readonly mounted: boolean;
  readonly accountSyncState: CloudPlatformScopeAccountSyncState;
  readonly setAndPersist: (nextScope: CloudPlatformScope) => void;
} {
  const [scope, setScope] = useState<CloudPlatformScope>(DEFAULT_CLOUD_PLATFORM_SCOPE);
  const [mounted, setMounted] = useState(false);
  const [accountSyncState, setAccountSyncState] = useState<CloudPlatformScopeAccountSyncState>("idle");

  useEffect(() => {
    setScope(readCloudPlatformScopeFromStorage());
    setMounted(true);

    void syncCloudPlatformScopeFromServer().then((syncedScope) => {
      if (syncedScope === null) {
        return;
      }

      setScope(syncedScope);
    });
  }, []);

  useEffect(
    () =>
      subscribeCloudPlatformScopeChanges(() => {
        setScope(resolveLandingCloudPlatformScope());
      }),
    [],
  );

  const setAndPersist = useCallback((nextScope: CloudPlatformScope) => {
    setScope(nextScope);
    void persistCloudPlatformScope(nextScope).then((synced) => {
      setAccountSyncState(synced ? "synced" : "local-only");
    });
  }, []);

  return {
    scope,
    mounted,
    accountSyncState,
    setAndPersist,
  };
}
