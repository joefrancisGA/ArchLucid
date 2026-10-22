import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

export type ProvenanceReviewContext = {
  readonly reviewTitle: string | null;
  readonly statusLabel: string | null;
  readonly statusTagKind: EnterpriseStatusKind | null;
};

export type ProvenancePageWorkspaceProps = {
  readonly runId: string;
  readonly graph: ArchitectureRunProvenanceGraph;
  readonly provenanceTraceId: string | null;
  readonly reviewContext?: ProvenanceReviewContext | null;
  readonly dataOrigin?: "live" | "sample";
};
