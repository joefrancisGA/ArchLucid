import type { Metadata } from "next";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { metadataForArchitectureDraftEditRoute } from "@/lib/architecture/architecture-draft-route-metadata";

type ArchitectureDraftPageProps = {
  readonly params: Promise<{ architectureId: string }>;
};

export async function generateMetadata(props: ArchitectureDraftPageProps): Promise<Metadata> {
  const rawArchitectureId = (await props.params).architectureId;
  let architectureId = rawArchitectureId.trim();

  try {
    architectureId = decodeURIComponent(architectureId);
  } catch {
    // Keep the raw segment when it is not URI-encoded.
  }

  return metadataForArchitectureDraftEditRoute(architectureId);
}

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
        <ArchitectureDraftWorkspace architectureId={architectureId} />
      </div>
    </OperatorPageContainer>
  );
}
