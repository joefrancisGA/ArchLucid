"use client";

import { useCallback, useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  type AuditTrailViewMode,
  defaultAuditTrailViewMode,
  readAuditTrailViewModeFromStorage,
  resolveAuditTrailViewMode,
  writeAuditTrailViewModeToStorage,
} from "@/lib/audit-trail-view-mode";

export type UseAuditPageViewModeResult = {
  readonly buyerPolishedShell: boolean;
  readonly viewMode: AuditTrailViewMode;
  readonly onViewModeChange: (mode: AuditTrailViewMode) => void;
};

export function useAuditPageViewMode(): UseAuditPageViewModeResult {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [viewMode, setViewModeState] = useState<AuditTrailViewMode>(() =>
    defaultAuditTrailViewMode(buyerPolishedShell),
  );

  useEffect(() => {
    const storedMode = readAuditTrailViewModeFromStorage();
    const resolved = resolveAuditTrailViewMode({
      buyerPolishedShell,
      storedMode,
    });

    setViewModeState(resolved);
  }, [buyerPolishedShell]);

  const onViewModeChange = useCallback((mode: AuditTrailViewMode) => {
    setViewModeState(mode);
    writeAuditTrailViewModeToStorage(mode);
  }, []);

  return {
    buyerPolishedShell,
    viewMode,
    onViewModeChange,
  };
}
