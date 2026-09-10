import { OIDC_USER_SUBJECT_KEY } from "@/lib/oidc/storage-keys";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

import type { InfraEvidenceAskResponse } from "@/lib/infra-evidence/infra-evidence-ask-types";

const INFRA_EVIDENCE_ASK_TRANSCRIPT_STORAGE_PREFIX = "archlucid.infra-evidence.ask-transcript.";

export type InfraEvidenceAskTurn = {
  readonly question: string;
  readonly response: InfraEvidenceAskResponse;
};

export type InfraEvidenceAskTranscriptState = {
  readonly turns: readonly InfraEvidenceAskTurn[];
  readonly draft: string;
};

export type InfraEvidenceAskScopeKeyInput = {
  readonly cloudResourceId?: string;
  readonly snapshotId?: string;
  readonly diffId?: string;
  readonly findingId?: string;
  readonly instanceId?: string;
  readonly correspondenceId?: string;
  readonly runId?: string;
  readonly seedNodeId?: string;
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
  readonly workQueue?: string;
  readonly hubTab?: string;
};

const EMPTY_TRANSCRIPT: InfraEvidenceAskTranscriptState = {
  turns: [],
  draft: "",
};

function readTranscriptUserSubject(): string {
  if (typeof window === "undefined") {
    return "anonymous";
  }

  const subject = window.sessionStorage.getItem(OIDC_USER_SUBJECT_KEY)?.trim() ?? "";

  return subject.length > 0 ? subject : "anonymous";
}

function resolveTranscriptStorageKey(scopeKey: string): string {
  const tenantId = readOperatorScopeFromStorage()?.tenantId?.trim() ?? "unknown";
  const userSubject = readTranscriptUserSubject();

  return `${INFRA_EVIDENCE_ASK_TRANSCRIPT_STORAGE_PREFIX}${tenantId}.${userSubject}.${scopeKey}`;
}

export function clearInfraEvidenceAskTranscriptStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);

    if (key != null && key.startsWith(INFRA_EVIDENCE_ASK_TRANSCRIPT_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.sessionStorage.removeItem(key);
  }
}

function normalizeScopePart(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : "_";
}

export function buildInfraEvidenceAskScopeKey(input: InfraEvidenceAskScopeKeyInput): string {
  const parts = [
    normalizeScopePart(input.cloudResourceId),
    normalizeScopePart(input.snapshotId),
    normalizeScopePart(input.diffId),
    normalizeScopePart(input.findingId),
    normalizeScopePart(input.instanceId),
    normalizeScopePart(input.correspondenceId),
    normalizeScopePart(input.runId),
    normalizeScopePart(input.seedNodeId),
    normalizeScopePart(input.assessmentId),
    normalizeScopePart(input.auditEvidenceSnapshotId),
    normalizeScopePart(input.controlId),
    normalizeScopePart(input.workQueue),
    normalizeScopePart(input.hubTab),
  ];

  return parts.join("|");
}

function isInfraEvidenceAskTurn(value: unknown): value is InfraEvidenceAskTurn {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const candidate = value as InfraEvidenceAskTurn;

  return typeof candidate.question === "string" && candidate.response != null && typeof candidate.response === "object";
}

function parseTranscriptState(raw: string): InfraEvidenceAskTranscriptState {
  const parsed = JSON.parse(raw) as {
    turns?: unknown;
    draft?: unknown;
  };

  const turns = Array.isArray(parsed.turns)
    ? parsed.turns.filter(isInfraEvidenceAskTurn)
    : [];
  const draft = typeof parsed.draft === "string" ? parsed.draft : "";

  return { turns, draft };
}

export function readInfraEvidenceAskTranscript(scopeKey: string): InfraEvidenceAskTranscriptState {
  if (typeof window === "undefined" || scopeKey.trim().length === 0) {
    return EMPTY_TRANSCRIPT;
  }

  try {
    const raw = window.sessionStorage.getItem(resolveTranscriptStorageKey(scopeKey));

    if (raw == null || raw.trim().length === 0) {
      return EMPTY_TRANSCRIPT;
    }

    return parseTranscriptState(raw);
  }
  catch {
    return EMPTY_TRANSCRIPT;
  }
}

export function shouldSkipInfraEvidenceAskTranscriptWrite(
  scopeKey: string,
  state: InfraEvidenceAskTranscriptState,
): boolean {
  if (state.turns.length > 0 || state.draft.trim().length > 0) {
    return false;
  }

  const stored = readInfraEvidenceAskTranscript(scopeKey);

  return stored.turns.length > 0 || stored.draft.trim().length > 0;
}

export function writeInfraEvidenceAskTranscript(
  scopeKey: string,
  state: InfraEvidenceAskTranscriptState,
): void {
  if (typeof window === "undefined" || scopeKey.trim().length === 0) {
    return;
  }

  if (shouldSkipInfraEvidenceAskTranscriptWrite(scopeKey, state)) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      resolveTranscriptStorageKey(scopeKey),
      JSON.stringify({
        turns: state.turns,
        draft: state.draft,
      }),
    );
  }
  catch {
    // sessionStorage may be unavailable or quota-exhausted in private mode.
  }
}

export function parkInfraEvidenceAskTranscript(
  scopeKey: string,
  state: InfraEvidenceAskTranscriptState,
): void {
  writeInfraEvidenceAskTranscript(scopeKey, state);
}

export function mergeCannedQuestionIntoDraft(draft: string, cannedQuestion: string): string {
  const trimmedCanned = cannedQuestion.trim();

  if (trimmedCanned.length === 0) {
    return draft;
  }

  const trimmedDraft = draft.trim();

  if (trimmedDraft.length === 0) {
    return trimmedCanned;
  }

  if (trimmedDraft.includes(trimmedCanned)) {
    return draft;
  }

  const needsSeparator = draft.length > 0 && !draft.endsWith(" ") && !draft.endsWith("\n");

  return `${draft}${needsSeparator ? " " : ""}${trimmedCanned}`;
}
