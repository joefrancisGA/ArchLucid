import { withDraftPatchCas, type DraftPatchCasFields } from "@/lib/architecture/architecture-draft-patch-cas";

/**
 * Client-side CAS decision for an online persist cycle (LW-029 / LW-032).
 * Field payloads stay field-only; this only chooses the token or Keep mine.
 */
export type OnlineDraftPatchCasDecision =
  | { readonly kind: "forceOverwrite" }
  | { readonly kind: "conflict" }
  | { readonly kind: "token"; readonly expectedUpdatedUtc: string };

export function resolveOnlineDraftPatchCas(input: {
  readonly forceOverwrite: boolean;
  readonly createdThisPersist: boolean;
  readonly knownUpdatedUtc: string | null;
  readonly latestServerUpdatedUtc: string | null | undefined;
}): OnlineDraftPatchCasDecision {
  if (input.forceOverwrite) {
    return { kind: "forceOverwrite" };
  }

  const latest = input.latestServerUpdatedUtc?.trim() ?? "";
  const known = input.knownUpdatedUtc?.trim() ?? "";

  // The GET after a deferred create is this tab adopting server truth, not another session.
  if (!input.createdThisPersist && known.length > 0 && latest.length > 0 && latest !== known) {
    return { kind: "conflict" };
  }

  const token = latest.length > 0 ? latest : known;

  if (token.length === 0) {
    throw new Error("Draft PATCH CAS wrapper requires expectedUpdatedUtc unless forceOverwrite is true.");
  }

  return { kind: "token", expectedUpdatedUtc: token };
}

export function applyOnlineDraftPatchCas<T extends object>(
  payload: T,
  decision: OnlineDraftPatchCasDecision,
): T & DraftPatchCasFields {
  switch (decision.kind) {
    case "forceOverwrite":
      return withDraftPatchCas(payload, { forceOverwrite: true });
    case "token":
      return withDraftPatchCas(payload, { expectedUpdatedUtc: decision.expectedUpdatedUtc });
    case "conflict":
      throw new Error("Draft PATCH CAS conflict must be handled before applying the wrapper.");
    default: {
      const exhaustive: never = decision;
      throw new Error(`Unhandled draft PATCH CAS decision: ${JSON.stringify(exhaustive)}`);
    }
  }
}
