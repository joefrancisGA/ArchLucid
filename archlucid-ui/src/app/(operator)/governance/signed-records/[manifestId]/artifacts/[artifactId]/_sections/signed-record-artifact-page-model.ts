import type { PreparedArtifactBody } from "@/lib/artifact-review-helpers";
import type { ArtifactDescriptor } from "@/types/authority";

export type SignedRecordArtifactPageSuccessModel = {
  readonly manifestId: string;
  readonly artifactId: string;
  readonly buyerPolishedLayout: boolean;
  readonly descriptor: ArtifactDescriptor;
  readonly siblings: ArtifactDescriptor[];
  readonly prepared: PreparedArtifactBody;
  readonly contentType: string;
  readonly byteLength: number;
  readonly truncated: boolean;
  readonly contentError: string | null;
  readonly runId: string | null;
};
