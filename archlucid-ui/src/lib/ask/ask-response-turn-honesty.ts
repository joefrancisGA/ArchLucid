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

export const REVIEW_ASK_CITED_FINDINGS_NOT_STORED_LABEL =
  "Ask cited findings were not stored on this answer." as const;
export const REVIEW_ASK_CITED_FINDINGS_STORED_EMPTY_LABEL =
  "Ask cited findings were stored empty on this answer." as const;
export const REVIEW_ASK_CITED_DECISIONS_NOT_STORED_LABEL =
  "Ask cited decisions were not stored on this answer." as const;
export const REVIEW_ASK_CITED_DECISIONS_STORED_EMPTY_LABEL =
  "Ask cited decisions were stored empty on this answer." as const;
export const REVIEW_ASK_CITED_ARTIFACTS_NOT_STORED_LABEL =
  "Ask cited artifacts were not stored on this answer." as const;
export const REVIEW_ASK_CITED_ARTIFACTS_STORED_EMPTY_LABEL =
  "Ask cited artifacts were stored empty on this answer." as const;

export const FINDING_ASK_CITED_FINDINGS_NOT_STORED_LABEL =
  "Cited findings were not stored on this answer." as const;
export const FINDING_ASK_CITED_FINDINGS_STORED_EMPTY_LABEL =
  "Cited findings were stored empty on this answer." as const;
export const FINDING_ASK_CITED_DECISIONS_NOT_STORED_LABEL =
  "Cited decisions were not stored on this answer." as const;
export const FINDING_ASK_CITED_DECISIONS_STORED_EMPTY_LABEL =
  "Cited decisions were stored empty on this answer." as const;
export const FINDING_ASK_CITED_ARTIFACTS_NOT_STORED_LABEL =
  "Cited artifacts were not stored on this answer." as const;
export const FINDING_ASK_CITED_ARTIFACTS_STORED_EMPTY_LABEL =
  "Cited artifacts were stored empty on this answer." as const;

export const REVIEW_ASK_STREAMING_UUID_LINKS_NOTE =
  "Streaming answer — UUIDs in the text are not linked until the answer finishes and citations are stored." as const;

export const REVIEW_ASK_STREAMING_ANSWER_PENDING_LABEL =
  "Answer text has not arrived." as const;

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

function citationRefListHasStoredContent(list: readonly string[] | null | undefined): boolean {
  return (list ?? []).some((id) => id.trim().length > 0);
}

function citationRefListStoredEmpty(list: readonly string[] | null | undefined): boolean {
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

type AskCitationListHonestyLabels = {
  readonly findingsNotStored: string;
  readonly findingsStoredEmpty: string;
  readonly decisionsNotStored: string;
  readonly decisionsStoredEmpty: string;
  readonly artifactsNotStored: string;
  readonly artifactsStoredEmpty: string;
  readonly allNotStored: string;
  readonly allStoredEmpty: string;
};

const REVIEW_ASK_CITATION_LIST_LABELS: AskCitationListHonestyLabels = {
  findingsNotStored: REVIEW_ASK_CITED_FINDINGS_NOT_STORED_LABEL,
  findingsStoredEmpty: REVIEW_ASK_CITED_FINDINGS_STORED_EMPTY_LABEL,
  decisionsNotStored: REVIEW_ASK_CITED_DECISIONS_NOT_STORED_LABEL,
  decisionsStoredEmpty: REVIEW_ASK_CITED_DECISIONS_STORED_EMPTY_LABEL,
  artifactsNotStored: REVIEW_ASK_CITED_ARTIFACTS_NOT_STORED_LABEL,
  artifactsStoredEmpty: REVIEW_ASK_CITED_ARTIFACTS_STORED_EMPTY_LABEL,
  allNotStored: REVIEW_ASK_SOURCES_NOT_STORED_LABEL,
  allStoredEmpty: REVIEW_ASK_SOURCES_STORED_EMPTY_LABEL,
};

const FINDING_ASK_CITATION_LIST_LABELS: AskCitationListHonestyLabels = {
  findingsNotStored: FINDING_ASK_CITED_FINDINGS_NOT_STORED_LABEL,
  findingsStoredEmpty: FINDING_ASK_CITED_FINDINGS_STORED_EMPTY_LABEL,
  decisionsNotStored: FINDING_ASK_CITED_DECISIONS_NOT_STORED_LABEL,
  decisionsStoredEmpty: FINDING_ASK_CITED_DECISIONS_STORED_EMPTY_LABEL,
  artifactsNotStored: FINDING_ASK_CITED_ARTIFACTS_NOT_STORED_LABEL,
  artifactsStoredEmpty: FINDING_ASK_CITED_ARTIFACTS_STORED_EMPTY_LABEL,
  allNotStored: FINDING_ASK_SOURCES_NOT_STORED_LABEL,
  allStoredEmpty: FINDING_ASK_SOURCES_STORED_EMPTY_LABEL,
};

function askCitationListHonestyLabels(
  refs: AskWireCitationRefs,
  labels: AskCitationListHonestyLabels,
): readonly string[] {
  if (askWireCitationRefsOmitted(refs)) {
    return [labels.allNotStored];
  }

  if (askWireCitationRefsStoredEmpty(refs)) {
    return [labels.allStoredEmpty];
  }

  const messages: string[] = [];

  if (refs.referencedFindings === null || refs.referencedFindings === undefined) {
    messages.push(labels.findingsNotStored);
  } else if (citationRefListStoredEmpty(refs.referencedFindings)) {
    messages.push(labels.findingsStoredEmpty);
  }

  if (refs.referencedDecisions === null || refs.referencedDecisions === undefined) {
    messages.push(labels.decisionsNotStored);
  } else if (citationRefListStoredEmpty(refs.referencedDecisions)) {
    messages.push(labels.decisionsStoredEmpty);
  }

  if (refs.referencedArtifacts === null || refs.referencedArtifacts === undefined) {
    messages.push(labels.artifactsNotStored);
  } else if (citationRefListStoredEmpty(refs.referencedArtifacts)) {
    messages.push(labels.artifactsStoredEmpty);
  }

  return messages;
}

export function reviewAskCitationListHonestyLabels(refs: AskWireCitationRefs): readonly string[] {
  return askCitationListHonestyLabels(refs, REVIEW_ASK_CITATION_LIST_LABELS);
}

export function findingAskCitationListHonestyLabels(refs: AskWireCitationRefs): readonly string[] {
  return askCitationListHonestyLabels(refs, FINDING_ASK_CITATION_LIST_LABELS);
}

export function formatAskCitationListHonestyLabels(labels: readonly string[]): string {
  return labels.join(" ");
}

export function reviewAskSourcesHonestyLabel(refs: AskWireCitationRefs): string {
  return formatAskCitationListHonestyLabels(reviewAskCitationListHonestyLabels(refs));
}

export function findingAskSourcesHonestyLabel(refs: AskWireCitationRefs): string {
  return formatAskCitationListHonestyLabels(findingAskCitationListHonestyLabels(refs));
}
