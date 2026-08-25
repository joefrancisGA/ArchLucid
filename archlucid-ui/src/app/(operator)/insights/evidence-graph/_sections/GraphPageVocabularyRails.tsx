"use client";

import { ArchitectureIntelligenceEvidenceGraphVocabularyRail } from "@/components/ArchitectureIntelligenceEvidenceGraphVocabularyRail";
import { AuditEvidenceTrailVocabularyRail } from "@/components/AuditEvidenceTrailVocabularyRail";
import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import { RunProvenanceEvidenceGraphVocabularyRail } from "@/components/runs/RunProvenanceEvidenceGraphVocabularyRail";

export function GraphPageVocabularyRails(): React.ReactElement {
  return (
    <>
      <ArchitectureIntelligenceEvidenceGraphVocabularyRail currentSurfaceId="evidence-graph" />
      <AuditEvidenceTrailVocabularyRail currentSurfaceId="evidence-graph" />
      <RunProvenanceEvidenceGraphVocabularyRail currentSurfaceId="evidence-graph" />
      <PackageEvidenceEvidenceGraphVocabularyRail currentSurfaceId="evidence-graph" />
    </>
  );
}
