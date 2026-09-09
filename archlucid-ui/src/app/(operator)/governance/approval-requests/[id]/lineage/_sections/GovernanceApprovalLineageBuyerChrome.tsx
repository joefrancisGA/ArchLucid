"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { GovernanceApprovalLineageSourcesOrientationStrip } from "./GovernanceApprovalLineageSourcesOrientationStrip";

/** Buyer default: mount Sources follow-ups after primary approval lineage body (GAI). */
export function GovernanceApprovalLineageBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return <GovernanceApprovalLineageSourcesOrientationStrip />;
}
