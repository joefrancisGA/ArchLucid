"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import { ArchitectureIdentityListClient } from "@/components/architecture/ArchitectureIdentityListClient";

/** Guided shows draft inventory; Working shows durable architecture identities (DA-04). */
export function ArchitecturesHubListSection(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return isWorkingMode ? <ArchitectureIdentityListClient /> : <ArchitectureDraftListClient />;
}
