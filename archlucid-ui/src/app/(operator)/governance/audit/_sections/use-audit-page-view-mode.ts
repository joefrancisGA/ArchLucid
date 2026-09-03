"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  type AuditTrailViewMode,
  readAuditTrailViewModeFromStorage,
  resolveAuditTrailViewMode,
  writeAuditTrailViewModeToStorage,
} from "@/lib/audit-trail-view-mode";
import { parseAuditTrailViewModeFromSearch } from "@/lib/governance/audit-trail-view-url";

export type UseAuditPageViewModeResult = {
  readonly buyerPolishedShell: boolean;
  readonly viewMode: AuditTrailViewMode;
  readonly currentSearch: string;
};

export function useAuditPageViewMode(): UseAuditPageViewModeResult {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlViewMode = searchParams.get("view");
  const [storedMode, setStoredMode] = useState<AuditTrailViewMode | null>(null);

  useEffect(() => {
    setStoredMode(readAuditTrailViewModeFromStorage());
  }, []);

  const viewMode =
    urlViewMode !== null && urlViewMode.trim().length > 0
      ? parseAuditTrailViewModeFromSearch(urlViewMode, buyerPolishedShell)
      : resolveAuditTrailViewMode({
          buyerPolishedShell,
          storedMode,
        });

  useEffect(() => {
    writeAuditTrailViewModeToStorage(viewMode);
  }, [viewMode]);

  return {
    buyerPolishedShell,
    viewMode,
    currentSearch,
  };
}
