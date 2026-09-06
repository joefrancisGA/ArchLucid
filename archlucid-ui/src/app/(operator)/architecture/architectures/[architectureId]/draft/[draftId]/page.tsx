import type { Metadata } from "next";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { metadataForArchitectureDraftEditRoute } from "@/lib/architecture/architecture-draft-route-metadata";

type ArchitectureDraftEditorPageProps = {
  readonly params: Promise<{ architectureId: string; draftId: string }>;
};

export async function generateMetadata(props: ArchitectureDraftEditorPageProps): Promise<Metadata> {
  const resolved = await props.params;
  let draftId = resolved.draftId.trim();

  try {
    draftId = decodeURIComponent(draftId);
  } catch {
    // Keep the raw segment when it is not URI-encoded.
  }

  return metadataForArchitectureDraftEditRoute(draftId);
}

export default async function ArchitectureDraftEditorPage(
  props: ArchitectureDraftEditorPageProps,
): Promise<React.JSX.Element> {
  const resolved = await props.params;
  let draftId = resolved.draftId.trim();

  try {
    draftId = decodeURIComponent(draftId);
  } catch {
    // Keep the raw segment when it is not URI-encoded.
  }

  return (
    <OperatorPageContainer variant="workflow">
      <div className="mt-6 space-y-4">
        <ArchitectureDraftWorkspace architectureId={draftId} />
      </div>
    </OperatorPageContainer>
  );
}
