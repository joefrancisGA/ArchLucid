import { isReadableInferredClarificationAnswer } from "@/lib/inferred-clarification-answer-quality";
import {
  isHeadingOnlyChunk,
  splitInferenceChunks,
  truncateAtWordBoundary,
} from "@/lib/universal-intake-inference-chunks";

const ACTOR_TABLE_HEADER_LINES = new Set([
  "actors",
  "actor",
  "how they touch the system",
  "how they touch the system actors actor",
  "actors actor how they touch the system",
]);

const ACTOR_ROLE_PATTERN =
  /\b(?:operators?|architects?|sponsors?|evaluators?|api clients?|service accounts?|machine users?|partner teams?|administrators?|batch jobs?|cli\s*\/\s*ci)\b/i;

const PROSE_ACTOR_PATTERN =
  /\b(?:API clients?|service accounts?|machine users?|partner teams?|partner integrations?|external integrations?|administrators?|operators?|batch jobs?|cli\s*\/\s*ci)\b/i;

const TOUCHPOINT_PATTERN =
  /\b(?:browser|https|http|ui|workspace|jwt|api|front door|apim|next\.js)\b|→|—/i;

function normalizeHeaderKey(line: string): string {
  return line
    .toLowerCase()
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isActorTableHeaderLine(line: string): boolean {
  const key = normalizeHeaderKey(line);

  return ACTOR_TABLE_HEADER_LINES.has(key);
}

function isDiagramCaptionLine(line: string): boolean {
  return /^Diagram\s*[—\-]/i.test(line.trim()) || /\bDiagram\s*[—\-]/i.test(line);
}

function isActorRoleChunk(chunk: string): boolean {
  return ACTOR_ROLE_PATTERN.test(chunk);
}

function isTouchpointChunk(chunk: string): boolean {
  return TOUCHPOINT_PATTERN.test(chunk);
}

function formatActorPairSentence(role: string, touch: string): string {
  const roleLabel = role.trim();
  const touchLabel = touch.trim();

  if (touchLabel.length === 0) {
    return roleLabel;
  }

  if (/\b(?:browser|ui|workspace)\b/i.test(touchLabel)) {
    return `${roleLabel} use ${touchLabel}`;
  }

  if (/\b(?:https?|api)\b/i.test(touchLabel)) {
    return `${roleLabel} call ${touchLabel}`;
  }

  return `${roleLabel}: ${touchLabel}`;
}

function synthesizeFromActorTableLines(lines: readonly string[]): string | null {
  const sentences: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";

    if (line.length === 0 || isActorTableHeaderLine(line) || isDiagramCaptionLine(line)) {
      continue;
    }

    if (/^Business outcome:/i.test(line)) {
      continue;
    }

    if (!isActorRoleChunk(line)) {
      continue;
    }

    const nextLine = lines[index + 1]?.trim() ?? "";
    let touch = "";

    if (nextLine.length > 0 && isTouchpointChunk(nextLine) && !isActorRoleChunk(nextLine)) {
      touch = nextLine;
      index += 1;
    }

    sentences.push(formatActorPairSentence(line, touch));
  }

  if (sentences.length === 0) {
    return null;
  }

  const body = sentences.slice(0, 3).join(". ");
  const answer = `Yes. ${body}.`;

  return truncateAtWordBoundary(answer, 480);
}

function findProseActorSentence(corpus: string): string | null {
  for (const chunk of splitInferenceChunks(corpus)) {
    if (isHeadingOnlyChunk(chunk) || isDiagramCaptionLine(chunk)) {
      continue;
    }

    if (/^Business outcome:/i.test(chunk.trim())) {
      continue;
    }

    if (PROSE_ACTOR_PATTERN.test(chunk)) {
      return truncateAtWordBoundary(chunk);
    }
  }

  return null;
}

/** Builds a yes/no actor answer from table rows or prose; never returns a flattened table dump. */
export function synthesizeAdditionalActorsAnswer(corpus: string): string | null {
  const proseSentence = findProseActorSentence(corpus);

  if (proseSentence !== null && isReadableInferredClarificationAnswer(proseSentence)) {
    return proseSentence;
  }

  const lines = corpus.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  const synthesized = synthesizeFromActorTableLines(lines);

  if (synthesized === null) {
    return null;
  }

  if (!isReadableInferredClarificationAnswer(synthesized)) {
    return null;
  }

  return synthesized;
}
