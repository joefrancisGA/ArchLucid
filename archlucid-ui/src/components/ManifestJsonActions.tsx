import type { ReactElement } from "react";

import { CopyManifestButton } from "@/components/CopyManifestButton";
import { DownloadManifestButton } from "@/components/DownloadManifestButton";

type ManifestJsonActionsProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
  readonly className?: string;
  readonly buyerPolishedLayout?: boolean;
  readonly careerArtifactHonesty?: Omit<
    import("@/lib/career-artifact/career-artifact-honesty").CareerArtifactHonestyInput,
    "artifactKind" | "runId" | "workingDesk"
  >;
};

/** Download + clipboard copy for committed golden manifest JSON. */
export function ManifestJsonActions(props: ManifestJsonActionsProps): ReactElement {
  const { runId, manifestVersion, className, buyerPolishedLayout, careerArtifactHonesty } = props;

  return (
    <div className={className ?? "flex flex-wrap gap-2"} data-testid="manifest-json-actions">
      <DownloadManifestButton
        runId={runId}
        manifestVersion={manifestVersion}
        className="space-y-0"
        buyerPolishedLayout={buyerPolishedLayout}
        careerArtifactHonesty={careerArtifactHonesty}
      />
      <CopyManifestButton
        runId={runId}
        manifestVersion={manifestVersion}
        className="space-y-0"
        buyerPolishedLayout={buyerPolishedLayout}
        careerArtifactHonesty={careerArtifactHonesty}
      />
    </div>
  );
}
