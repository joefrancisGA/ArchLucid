export const ASK_ANSWER_NOT_STORED_LABEL = "Answer was not stored." as const;
export const ASK_ANSWER_STORED_EMPTY_LABEL = "Answer was stored empty." as const;

export const REVIEW_ASK_SOURCES_NOT_STORED_LABEL =
  "Ask sources were not stored on this answer." as const;
export const REVIEW_ASK_SOURCES_STORED_EMPTY_LABEL =
  "Ask sources were stored empty on this answer." as const;

export const FINDING_ASK_SOURCES_NOT_STORED_LABEL =
  "Sources were not stored on this answer." as const;
export const FINDING_ASK_SOURCES_STORED_EMPTY_LABEL =
  "Sources were stored empty on this answer." as const;

export const REVIEW_ASK_STREAMING_UUID_LINKS_NOTE =
  "Streaming answer — UUIDs in the text are not linked until the answer finishes and citations are stored." as const;

export type AskWireAnswerState = "not-stored" | "stored-empty" | "content";

export type AskWireCitationRefs = {
  readonly referencedFindings?: readonly string[] | null;
  readonly referencedDecisions?: readonly string[] | null;
  readonly referencedArtifacts?: readonly string[] | null;
};

export function resolveAskWireAnswerState(answer: string | null | undefined): AskWireAnswerState {
  if (answer === null || answer === undefined) {
    return "not-stored";
  }

  if (answer.trim().length === 0) {
    return "stored-empty";
  }

  return "content";
}

/** Persists null vs empty string so the UI can distinguish omitted from stored-empty answers. */
export function normalizeAskWireAnswerForTurn(answer: string | null | undefined): string | null {
  const state = resolveAskWireAnswerState(answer);

  if (state === "not-stored") {
    return null;
  }

  if (state === "stored-empty") {
    return "";
  }

  return answer!.trim();
}

function askWireCitationRefFieldOmitted(value: readonly string[] | null | undefined): boolean {
  return value === undefined || value === null;
}

export function askWireCitationRefsOmitted(refs: AskWireCitationRefs): boolean {
  return (
    askWireCitationRefFieldOmitted(refs.referencedFindings)
    && askWireCitationRefFieldOmitted(refs.referencedDecisions)
    && askWireCitationRefFieldOmitted(refs.referencedArtifacts)
  );
}

function citationRefListHasStoredContent(list: readonly string[] | undefined): boolean {
  return (list ?? []).some((id) => id.trim().length > 0);
}

function citationRefListStoredEmpty(list: readonly string[] | undefined): boolean {
  const values = list ?? [];

  return values.length === 0 || values.every((id) => id.trim().length === 0);
}

export function askWireCitationRefsStoredEmpty(refs: AskWireCitationRefs): boolean {
  if (askWireCitationRefsOmitted(refs)) {
    return false;
  }

  return (
    citationRefListStoredEmpty(refs.referencedFindings)
    && citationRefListStoredEmpty(refs.referencedDecisions)
    && citationRefListStoredEmpty(refs.referencedArtifacts)
  );
}

export function askWireCitationRefsPresentInWire(refs: AskWireCitationRefs): boolean {
  if (askWireCitationRefsOmitted(refs) || askWireCitationRefsStoredEmpty(refs)) {
    return false;
  }

  return (
    citationRefListHasStoredContent(refs.referencedFindings)
    || citationRefListHasStoredContent(refs.referencedDecisions)
    || citationRefListHasStoredContent(refs.referencedArtifacts)
  );
}

export function reviewAskSourcesHonestyLabel(refs: AskWireCitationRefs): string {
  if (askWireCitationRefsOmitted(refs)) {
    return REVIEW_ASK_SOURCES_NOT_STORED_LABEL;
  }

  if (askWireCitationRefsStoredEmpty(refs)) {
    return REVIEW_ASK_SOURCES_STORED_EMPTY_LABEL;
  }

  return "";
}

export function findingAskSourcesHonestyLabel(refs: AskWireCitationRefs): string {
  if (askWireCitationRefsOmitted(refs)) {
    return FINDING_ASK_SOURCES_NOT_STORED_LABEL;
  }

  if (askWireCitationRefsStoredEmpty(refs)) {
    return FINDING_ASK_SOURCES_STORED_EMPTY_LABEL;
  }

  return "";
}
