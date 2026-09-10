"use client";

import type { ReactNode } from "react";

import { useGovernanceMode } from "@/hooks/use-governance-mode";

type GovernanceModePresentationGateProps = {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
};

/** Renders children only when approval view is enabled (client preference). */
export function GovernanceModePresentationGate(props: GovernanceModePresentationGateProps) {
  const { children, fallback = null } = props;
  const { mounted, isGovernanceModeEnabled } = useGovernanceMode();

  if (!mounted || !isGovernanceModeEnabled) {
    return fallback;
  }

  return children;
}
