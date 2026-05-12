import type { OperatorEvidenceLimitsExecutionProps } from "@/components/OperatorEvidenceLimitsFooter";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ArtifactDescriptor, ManifestSummary } from "@/types/authority";

/** Loaded state for the manifest detail success layout (after summary is confirmed). */
export type ManifestDetailPageSuccessModel = {
  readonly manifestId: string;
  readonly buyerPolishedLayout: boolean;
  readonly summary: ManifestSummary;
  readonly artifacts: ArtifactDescriptor[];
  readonly artifactsFailure: ApiLoadFailureState | null;
  readonly artifactsMalformed: string | null;
  readonly usedStaticDemoManifest: boolean;
  readonly manifestFooterExecution: OperatorEvidenceLimitsExecutionProps | null;
};
