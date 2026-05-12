import { isApiRequestError } from "@/lib/api-request-error";
import { toApiLoadFailure, uiFailureFromMessage, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { getArchitectureGraph, mergeArchitectureGraphPages } from "@/lib/graph-api";
import { coerceGraphViewModel } from "@/lib/operator-response-guards";
import type { GraphViewModel } from "@/types/graph";

export type LoadArchitectureGraphViewModelResult =
  | { ok: true; graph: GraphViewModel; note: string | null }
  | { ok: false; kind: "malformed"; message: string }
  | { ok: false; kind: "failure"; failure: ApiLoadFailureState };

const PAGINATED_ARCHITECTURE_NOTE =
  "Full graph response exceeded the API size limit; loaded all pages via the paginated endpoint. Edges appear only when both endpoints fall on the same page — some cross-page links may be missing from this view.";

/** Loads the architecture-oriented graph for a run (`GET /v1/graph/runs/{runId}`), merging pages on 413. */
export async function loadArchitectureGraphViewModel(runId: string): Promise<LoadArchitectureGraphViewModelResult> {
  const rid = runId.trim();

  if (rid.length === 0) {
    return {
      ok: false,
      kind: "failure",
      failure: uiFailureFromMessage("Review id is required to load the architecture graph."),
    };
  }

  let note: string | null = null;
  let raw: unknown;

  try {
    try {
      raw = await getArchitectureGraph(rid);
    } catch (err) {
      if (!isApiRequestError(err) || err.httpStatus !== 413) {
        throw err;
      }

      raw = await mergeArchitectureGraphPages(rid);
      note = PAGINATED_ARCHITECTURE_NOTE;
    }

    const coerced = coerceGraphViewModel(raw);

    if (!coerced.ok) {
      return { ok: false, kind: "malformed", message: coerced.message };
    }

    return { ok: true, graph: coerced.value, note };
  } catch (err) {
    return { ok: false, kind: "failure", failure: toApiLoadFailure(err) };
  }
}
