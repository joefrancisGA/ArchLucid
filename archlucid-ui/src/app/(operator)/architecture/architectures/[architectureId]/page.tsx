import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { ArchitectureIdentityDesk } from "@/components/architecture/ArchitectureIdentityDesk";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import {
  ARCHITECTURE_DRAFT_QUERY_PARAM,
  ARCHITECTURE_NEW_DRAFT_SEGMENT,
  architectureNestedDraftPath,
} from "@/lib/architecture/architecture-routes";
import { metadataForArchitectureDraftEditRoute } from "@/lib/architecture/architecture-draft-route-metadata";
import { resolveArchitectureRouteSegment } from "@/lib/architecture/resolve-architecture-route-segment";

type ArchitectureSegmentPageProps = {
  readonly params: Promise<{ architectureId: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function decodeRouteSegment(raw: string): string {
  const trimmed = raw.trim();

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function readDraftQueryParam(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const raw = searchParams[ARCHITECTURE_DRAFT_QUERY_PARAM];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

export async function generateMetadata(props: ArchitectureSegmentPageProps): Promise<Metadata> {
  const segment = decodeRouteSegment((await props.params).architectureId);

  return metadataForArchitectureDraftEditRoute(segment);
}

export default async function ArchitectureSegmentPage(
  props: ArchitectureSegmentPageProps,
): Promise<React.JSX.Element> {
  const segment = decodeRouteSegment((await props.params).architectureId);
  const searchParams = await props.searchParams;
  const draftQueryId = readDraftQueryParam(searchParams);
  const resolved = await resolveArchitectureRouteSegment(segment);

  if (resolved.kind === "draft-handoff") {
    redirect(architectureNestedDraftPath(resolved.architectureId, resolved.draftId));
  }

  if (resolved.kind === "new-draft") {
    return (
      <OperatorPageContainer variant="workflow">
        <div className="mt-6 space-y-4">
          <ArchitectureDraftWorkspace draftId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />
        </div>
      </OperatorPageContainer>
    );
  }

  if (resolved.kind === "legacy-draft") {
    return (
      <OperatorPageContainer variant="workflow">
        <div className="mt-6 space-y-4">
          <ArchitectureDraftWorkspace draftId={resolved.draftId} legacyDraftWithoutIdentity />
        </div>
      </OperatorPageContainer>
    );
  }

  if (draftQueryId !== null) {
    redirect(architectureNestedDraftPath(resolved.architectureId, draftQueryId));
  }

  return (
    <OperatorPageContainer variant="workflow">
      <div className="mt-6 space-y-4">
        <ArchitectureIdentityDesk architectureId={resolved.architectureId} />
      </div>
    </OperatorPageContainer>
  );
}
