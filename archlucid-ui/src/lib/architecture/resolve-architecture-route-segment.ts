import { notFound } from "next/navigation";

import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { isArchitectureNewDraftSegment } from "@/lib/architecture/architecture-routes";
import { isApiRequestError } from "@/lib/api-request-error";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";

export type ResolvedArchitectureRouteSegment =
  | { readonly kind: "new-draft" }
  | { readonly kind: "identity"; readonly architectureId: string }
  | { readonly kind: "legacy-draft"; readonly draftId: string }
  | { readonly kind: "draft-handoff"; readonly architectureId: string; readonly draftId: string };

/** Probes identity vs draft APIs for `/architecture/architectures/{segment}` (DA-05 compatibility). */
export async function resolveArchitectureRouteSegment(
  segment: string,
): Promise<ResolvedArchitectureRouteSegment> {
  const trimmed = segment.trim();

  if (isArchitectureNewDraftSegment(trimmed)) {
    return { kind: "new-draft" };
  }

  const scopeHeaders = await getServerResolvedScopeHeaders();

  try {
    await getArchitectureIdentity(trimmed, { scopeHeaders });

    return { kind: "identity", architectureId: trimmed };
  } catch (error: unknown) {
    if (!isApiRequestError(error) || error.httpStatus !== 404) {
      throw error;
    }
  }

  try {
    const draft = await getDraftRequest(trimmed, { scopeHeaders });
    const parentArchitectureId = draft.architectureId?.trim() ?? "";

    if (parentArchitectureId.length > 0) {
      return {
        kind: "draft-handoff",
        architectureId: parentArchitectureId,
        draftId: draft.draftId,
      };
    }

    return { kind: "legacy-draft", draftId: trimmed };
  } catch (error: unknown) {
    if (isApiRequestError(error) && error.httpStatus === 404) {
      notFound();
    }

    throw error;
  }
}
