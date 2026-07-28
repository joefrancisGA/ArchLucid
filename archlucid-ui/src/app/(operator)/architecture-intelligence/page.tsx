import { Suspense } from "react";

import { ArchitectureIntelligencePageClient } from "./_sections/ArchitectureIntelligencePageClient";

export default function ArchitectureIntelligencePage() {
  return (
    <Suspense fallback={null}>
      <ArchitectureIntelligencePageClient />
    </Suspense>
  );
}
