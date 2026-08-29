import { repairUtf8MojibakeOptional } from "@/lib/utf8-mojibake-repair";

const MOJIBAKE_MARKERS = /(?:â€|Ã.|Â§|ï¿½|\uFFFD)/u;

const ACTORS_TABLE_HEADER_PATTERN = /Actors\s+Actor\s+How they touch/i;
const DIAGRAM_CAPTION_PATTERN = /Diagram\s*[—\-]/i;
const TITLE_CASE_FRAGMENT_PATTERN = /(?:\b[A-Z][a-z]+\b\s*){4,}/;

/** Normalizes extracted document text before deterministic clarification inference. */
export function normalizeClarificationInferenceCorpus(corpus: string): string {
  const repaired = repairUtf8MojibakeOptional(corpus);

  return repaired
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function endsWithDanglingPunctuation(answer: string): boolean {
  return /(?:\.{3}|[—\-→])$/.test(answer);
}

function looksLikeTitleCaseFragmentDump(answer: string): boolean {
  if (/[.!?]/.test(answer)) {
    return false;
  }

  if (/^(?:Yes|No)\b/i.test(answer)) {
    return false;
  }

  const matches = answer.match(TITLE_CASE_FRAGMENT_PATTERN);

  if (matches === null) {
    return false;
  }

  return matches.some((match) => match.split(/\s+/).length >= 4);
}

function isStructuredConstraintAnswer(answer: string): boolean {
  if (/^(Azure|Aws|Gcp|None)$/.test(answer)) {
    return true;
  }

  if (/\bRTO\b/i.test(answer) || /\bRPO\b/i.test(answer)) {
    return true;
  }

  if (/\b99(?:\.\d+)?%\s*(?:uptime|availability)\b/i.test(answer)) {
    return true;
  }

  if (/^Monthly cost ceiling about \$/i.test(answer)) {
    return true;
  }

  if (/^None for this lifecycle stage\.$/i.test(answer)) {
    return true;
  }

  return false;
}

/**
 * Buyer-safe gate: never prefill clarification answers that look like truncated or corrupted extraction.
 */
export function isReadableInferredClarificationAnswer(answer: string): boolean {
  const trimmed = answer.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.endsWith("...")) {
    return false;
  }

  if (endsWithDanglingPunctuation(trimmed)) {
    return false;
  }

  if (MOJIBAKE_MARKERS.test(trimmed)) {
    return false;
  }

  if (ACTORS_TABLE_HEADER_PATTERN.test(trimmed)) {
    return false;
  }

  if (DIAGRAM_CAPTION_PATTERN.test(trimmed)) {
    return false;
  }

  const repaired = repairUtf8MojibakeOptional(trimmed);

  if (MOJIBAKE_MARKERS.test(repaired)) {
    return false;
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(repaired)) {
    return false;
  }

  const letters = repaired.match(/\p{L}/gu)?.length ?? 0;

  if (letters < 3) {
    return false;
  }

  const letterRatio = letters / repaired.length;

  if (letterRatio < 0.35) {
    return false;
  }

  if (isStructuredConstraintAnswer(repaired)) {
    return true;
  }

  if (!/[.!?]/.test(repaired) && !/^(?:Yes|No)\b/i.test(repaired)) {
    return false;
  }

  if (looksLikeTitleCaseFragmentDump(repaired)) {
    return false;
  }

  return true;
}

/** Drops inferred answers that fail the buyer-safe readability gate. */
export function filterQualityGatedInferredAnswers(
  answers: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  const filtered: Record<string, string> = {};

  for (const [questionKey, answer] of Object.entries(answers)) {
    if (isReadableInferredClarificationAnswer(answer)) {
      filtered[questionKey] = answer;
    }
  }

  return filtered;
}
