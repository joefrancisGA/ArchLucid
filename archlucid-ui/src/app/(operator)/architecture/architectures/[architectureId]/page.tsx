import type { Metadata } from "next";

import { ArchitectureSegmentResolver } from "@/components/architecture/ArchitectureSegmentResolver";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";

type ArchitectureIdentityPageProps = {
  readonly params: Promise<{ architectureId: string }>;
};

export async function generateMetadata(props: ArchitectureIdentityPageProps): Promise<Metadata> {
  const rawArchitectureId = (await props.params).architectureId;
  let architectureId = rawArchitectureId.trim();

  try {
    architectureId = decodeURIComponent(architectureId);
  } catch {
    // Keep the raw segment when it is not URI-encoded.
  }

  return {
    title: architectureId.length > 0 ? `Architecture · ${architectureId}` : "Architecture",
  };
}

export default async function ArchitectureIdentityPage(
  props: ArchitectureIdentityPageProps,
): Promise<React.JSX.Element> {
  const rawArchitectureId = (await props.params).architectureId;
  let architectureId = rawArchitectureId.trim();

  try {
    architectureId = decodeURIComponent(architectureId);
  } catch {
    // Keep the raw segment when it is not URI-encoded.
  }

  return (
    <OperatorPageContainer variant="workflow">
      <ArchitectureSegmentResolver segmentId={architectureId} />
    </OperatorPageContainer>
  );
}
