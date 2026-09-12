"use client";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import { ArchitectureIdentityListClient } from "@/components/architecture/ArchitectureIdentityListClient";
import { ArchitectureWorkingPortfolioDraftsSection } from "@/components/architecture/ArchitectureWorkingPortfolioDraftsSection";

/** Guided shows draft inventory; Working shows open drafts plus durable identities (DA-04 / SN-029). */
export function ArchitecturesHubListSection(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode) {
    return <ArchitectureDraftListClient />;
  }

  return (
    <div className="space-y-8" data-testid="architectures-hub-working-portfolio">
      <ArchitectureWorkingPortfolioDraftsSection />
      <ArchitectureIdentityListClient />
    </div>
  );
}
