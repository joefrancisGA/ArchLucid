import type { Metadata } from "next";

import { ArchitecturesDraftEvidenceOrientationStrip } from "@/app/(operator)/architecture/architectures/[architectureId]/_sections/ArchitecturesDraftEvidenceOrientationStrip";
import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";

export const metadata: Metadata = {
  title: CREATE_ARCHITECTURE_LABEL,
};

type ArchitectureDraftPageProps = {
  readonly params: Promise<{ architectureId: string }>;
};

export default async function ArchitectureDraftPage(props: ArchitectureDraftPageProps): Promise<React.JSX.Element> {
  const rawArchitectureId = (await props.params).architectureId;
  let architectureId = rawArchitectureId.trim();

  try {
    architectureId = decodeURIComponent(architectureId);
  } catch {
    // Keep the raw segment when it is not URI-encoded.
  }

  return (
    <OperatorPageContainer variant="workflow">
      <div className="mt-6 space-y-4">
        <ArchitecturesDraftEvidenceOrientationStrip />
        <ArchitectureDraftWorkspace architectureId={architectureId} />
      </div>
    </OperatorPageContainer>
  );
}
