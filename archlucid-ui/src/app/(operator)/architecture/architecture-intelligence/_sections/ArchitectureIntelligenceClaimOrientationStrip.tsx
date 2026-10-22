"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

import {
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
  buildArchitectureIntelligenceSources,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";

/** Claim discipline + Sources index for Architecture intelligence (AIN). */
export function ArchitectureIntelligenceClaimOrientationStrip(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-intelligence"
      sourcesIntro={ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO}
      sources={buildArchitectureIntelligenceSources(isWorkingMode)}
    />
  );
}
