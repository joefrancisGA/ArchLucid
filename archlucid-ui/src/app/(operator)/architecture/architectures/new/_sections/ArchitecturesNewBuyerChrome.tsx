"use client";

import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { ArchitecturesNewClaimOrientationStrip } from "./ArchitecturesNewClaimOrientationStrip";

/** Guided eval chrome: mount claim discipline + Sources on create-bootstrap (CA-47). */
export function ArchitecturesNewBuyerChrome(): React.JSX.Element | null {
  const evalChromeShell = useProductionEvalChrome();

  if (!evalChromeShell) {
    return null;
  }

  return (
    <div className="mb-6 text-left" data-testid="architectures-new-orientation-top">
      <ArchitecturesNewClaimOrientationStrip />
    </div>
  );
}
