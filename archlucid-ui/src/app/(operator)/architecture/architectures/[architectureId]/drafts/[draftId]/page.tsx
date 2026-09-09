import { notFound, redirect } from "next/navigation";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { isApiRequestError } from "@/lib/api-request-error";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import { isInvalidGuidOrSlugRouteToken } from "@/lib/route-dynamic-param";
import { readServerWorkingModeFromBffSession } from "@/lib/workspace-mode/read-server-working-mode";

type NestedArchitectureDraftPageProps = {
  readonly params: Promise<{ architectureId: string; draftId: string }>;
};

/** Working nested draft editor — spawn-locked drafts hand off to the architecture desk (AO-05 / AO-07). */
export default async function NestedArchitectureDraftPage(
  props: NestedArchitectureDraftPageProps,
): Promise<React.JSX.Element> {
  const { architectureId, draftId } = await props.params;

  if (isInvalidGuidOrSlugRouteToken(architectureId) || isInvalidGuidOrSlugRouteToken(draftId)) {
    notFound();
  }

  const scopeHeaders = await getServerResolvedScopeHeaders();

  try {
    const draft = await getDraftRequest(draftId, { scopeHeaders });
    const parentArchitectureId = draft.architectureId?.trim() ?? "";

    if (parentArchitectureId.length > 0 && parentArchitectureId !== architectureId.trim()) {
      notFound();
    }

    const workingMode = await readServerWorkingModeFromBffSession();
    const spawnedRunId = architectureDraftSpawnedRunId(draft);

    if (workingMode && spawnedRunId !== null) {
      redirect(architectureIdentityPath(architectureId));
    }
  } catch (error: unknown) {
    if (isApiRequestError(error) && error.httpStatus === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <OperatorPageContainer variant="workflow">
      <div className="mt-6 space-y-4">
        <ArchitectureDraftWorkspace draftId={draftId} parentArchitectureId={architectureId} />
      </div>
    </OperatorPageContainer>
  );
}
