import { repairUtf8MojibakeOptional } from "@/lib/utf8-mojibake-repair";

const MOJIBAKE_MARKERS = /(?:â€|Ã.|Â§|ï¿½|\uFFFD)/u;

/** Normalizes extracted document text before deterministic clarification inference. */
export function normalizeClarificationInferenceCorpus(corpus: string): string {
  return repairUtf8MojibakeOptional(corpus.replace(/\s+/g, " ").trim());
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

  if (MOJIBAKE_MARKERS.test(trimmed)) {
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

  return true;
}
