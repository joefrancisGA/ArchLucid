import { isApiRequestError } from "@/lib/api-request-error";
import { toApiLoadFailure, uiFailureFromMessage, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { getArchitectureGraph, getArchitectureGraphTemporalSnapshot, mergeArchitectureGraphPages } from "@/lib/graph-api";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { coerceGraphViewModel } from "@/lib/operator-response-guards";
import type { GraphViewModel } from "@/types/graph";

export type LoadArchitectureGraphViewModelResult =
  | {
      ok: true;
      graph: GraphViewModel;
      note: string | null;
      temporalResolution?: {
        resolvedRunId: string;
        resolvedRunCreatedUtc: string;
        asOfUtc: string;
      };
    }
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

/** Loads a temporal architecture graph for a review (`GET /v1/graph/snapshot`). */
export async function loadArchitectureGraphViewModelAtAsOf(
  anchorRunId: string,
  asOfIsoUtc: string,
): Promise<LoadArchitectureGraphViewModelResult> {
  const rid = anchorRunId.trim();

  if (rid.length === 0) {
    return {
      ok: false,
      kind: "failure",
      failure: uiFailureFromMessage("Review id is required to load the architecture graph."),
    };
  }

  try {
    const envelope = await getArchitectureGraphTemporalSnapshot(rid, asOfIsoUtc);
    const coerced = coerceGraphViewModel(envelope.graph);

    if (!coerced.ok) {
      return { ok: false, kind: "malformed", message: coerced.message };
    }

    let note: string | null = null;
    const resolvedId = envelope.resolvedRunId?.trim() ?? "";
    const anchorNorm = rid.toLowerCase();

    if (resolvedId.length > 0 && resolvedId.toLowerCase() !== anchorNorm) {
      const created = envelope.resolvedRunCreatedUtc?.trim() ?? "";
      const label = created.length > 0 ? formatInstantForLocale(created) : "an earlier instant";
      note = `Resolved to review ${resolvedId} (created ${label}) for the selected as-of instant.`;
    }

    const asOfNorm = envelope.asOfUtc?.trim() ?? asOfIsoUtc;

    return {
      ok: true,
      graph: coerced.value,
      note,
      temporalResolution:
        resolvedId.length > 0
          ? {
              resolvedRunId: resolvedId,
              resolvedRunCreatedUtc: envelope.resolvedRunCreatedUtc?.trim() ?? "",
              asOfUtc: asOfNorm,
            }
          : undefined,
    };
  } catch (err) {
    return { ok: false, kind: "failure", failure: toApiLoadFailure(err) };
  }
}
