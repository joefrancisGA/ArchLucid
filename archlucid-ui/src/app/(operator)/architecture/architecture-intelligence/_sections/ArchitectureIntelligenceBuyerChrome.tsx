"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { ArchitectureIntelligenceClaimOrientationStrip } from "./ArchitectureIntelligenceClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources without editing the server page shell. */
export function ArchitectureIntelligenceBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <ArchitectureIntelligenceClaimOrientationStrip />;
}
