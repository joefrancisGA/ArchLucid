"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitectureDraftDetailClaimOrientationStrip } from "./ArchitectureDraftDetailClaimOrientationStrip";

/** Guided eval chrome: mount claim discipline + Sources on saved draft detail (CA-47). */
export function ArchitectureDraftDetailBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return <ArchitectureDraftDetailClaimOrientationStrip />;
}
