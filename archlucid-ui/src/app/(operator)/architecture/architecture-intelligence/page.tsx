import { Suspense } from "react";

import { ArchitectureIntelligenceBuyerLabControlsGate } from "./_sections/ArchitectureIntelligenceBuyerLabControlsGate";
import { ArchitectureIntelligencePageClient } from "./_sections/ArchitectureIntelligencePageClient";
import { ArchitectureIntelligencePageSkeleton } from "./_sections/ArchitectureIntelligencePageSkeleton";

export default function ArchitectureIntelligencePage() {
  return (
    <Suspense fallback={<ArchitectureIntelligencePageSkeleton />}>
      <ArchitectureIntelligenceBuyerLabControlsGate>
        <ArchitectureIntelligencePageClient />
      </ArchitectureIntelligenceBuyerLabControlsGate>
    </Suspense>
  );
}
