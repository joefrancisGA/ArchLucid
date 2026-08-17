import { Suspense } from "react";

import { ArchitectureIntelligenceBuyerLabControlsGate } from "./_sections/ArchitectureIntelligenceBuyerLabControlsGate";
import { ArchitectureIntelligencePageClient } from "./_sections/ArchitectureIntelligencePageClient";

export default function ArchitectureIntelligencePage() {
  return (
    <Suspense fallback={null}>
      <ArchitectureIntelligenceBuyerLabControlsGate>
        <ArchitectureIntelligencePageClient />
      </ArchitectureIntelligenceBuyerLabControlsGate>
    </Suspense>
  );
}
