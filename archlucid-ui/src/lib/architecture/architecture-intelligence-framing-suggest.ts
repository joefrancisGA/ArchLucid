import {
  isConfirmedBriefEntry,
  parseQualityAttributeEntries,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import type { ArchitectureIntelligenceFramingQuestion } from "@/lib/architecture/architecture-intelligence-framing-interview";

export type FramingSuggestContext = {
  readonly combinedSourceText: string;
  readonly businessOutcome?: string;
  readonly structuredBrief?: ArchitectureDraftStructuredBriefState;
};

function extractLineValue(combinedText: string, marker: string): string | null {
  const line = combinedText
    .split("\n")
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.length > 0 && candidate.toLowerCase().includes(marker.toLowerCase()));

  if (line === undefined) {
    return null;
  }

  const colonIndex = line.indexOf(":");
  const dashIndex = line.indexOf("-");
  const separatorIndex = colonIndex >= 0 ? colonIndex : dashIndex;

  if (separatorIndex < 0 || separatorIndex >= line.length - 1) {
    return line.trim();
  }

  return line.slice(separatorIndex + 1).trim();
}

function inferBusinessOutcome(context: FramingSuggestContext): string | null {
  const outcome = context.businessOutcome?.trim() ?? "";

  if (outcome.length > 0) {
    return outcome;
  }

  if (context.combinedSourceText.toLowerCase().includes("business outcome")) {
    return extractLineValue(context.combinedSourceText, "business outcome");
  }

  return null;
}

function inferSystemBoundary(combinedText: string): string | null {
  const lower = combinedText.toLowerCase();

  if (lower.includes("system boundary")) {
    return extractLineValue(combinedText, "system boundary");
  }

  if (lower.includes("in scope") && lower.includes("out of scope")) {
    return "In-scope and out-of-scope boundaries referenced in source material.";
  }

  return null;
}

function inferFixedDecisions(context: FramingSuggestContext): string | null {
  const brief = context.structuredBrief;
  const constraints = brief?.confirmedConstraints.filter((item) => isConfirmedBriefEntry(item)) ?? [];

  if (constraints.length > 0) {
    return constraints.join("; ");
  }

  if (context.combinedSourceText.toLowerCase().includes("fixed decision")) {
    return extractLineValue(context.combinedSourceText, "fixed decision");
  }

  return null;
}

function inferCriticalQualityAttributes(context: FramingSuggestContext): string | null {
  const brief = context.structuredBrief;
  const qualityAttributes =
    brief === undefined
      ? []
      : parseQualityAttributeEntries(brief.qualityAttribute).filter((item) => isConfirmedBriefEntry(item));

  if (qualityAttributes.length > 0) {
    return qualityAttributes.join("; ");
  }

  const lower = context.combinedSourceText.toLowerCase();

  if (lower.includes("availability") || lower.includes("security")) {
    return "Availability and security called out in source material.";
  }

  return null;
}

function inferUnacceptableFailures(combinedText: string): string | null {
  const lower = combinedText.toLowerCase();

  if (lower.includes("unacceptable")) {
    return extractLineValue(combinedText, "unacceptable");
  }

  if (lower.includes("must not fail")) {
    return "Must-not-fail constraints referenced in source material.";
  }

  const failureMode = extractLineValue(combinedText, "failure mode");

  if (failureMode !== null && failureMode.length > 0) {
    return failureMode;
  }

  return null;
}

function inferArchitectureKind(combinedText: string): string | null {
  const lower = combinedText.toLowerCase();

  if (lower.includes("migration")) {
    return "Migration";
  }

  if (lower.includes("greenfield")) {
    return "Greenfield";
  }

  if (lower.includes("integration")) {
    return "Integration";
  }

  return null;
}

function inferFramingAnswer(questionId: string, context: FramingSuggestContext): string | null {
  const combinedText = context.combinedSourceText;

  switch (questionId) {
    case "business-outcome":
      return inferBusinessOutcome(context);
    case "system-boundary":
      return inferSystemBoundary(combinedText);
    case "fixed-decisions":
      return inferFixedDecisions(context);
    case "critical-quality-attributes":
      return inferCriticalQualityAttributes(context);
    case "unacceptable-failures":
      return inferUnacceptableFailures(combinedText);
    case "architecture-kind":
      return inferArchitectureKind(combinedText);
    default:
      return null;
  }
}

/** Deterministic framing suggestions from overview text — mirrors server inference (no LLM spend). */
export function suggestFramingAnswersFromOverview(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  context: FramingSuggestContext,
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  for (const question of questions) {
    const inferred = inferFramingAnswer(question.questionId, context);
    const confirmed = question.confirmedAnswer?.trim() ?? "";

    if (inferred !== null && inferred.length > 0) {
      suggestions[question.questionId] = inferred;
      continue;
    }

    if (confirmed.length > 0) {
      suggestions[question.questionId] = confirmed;
    }
  }

  return suggestions;
}

export function countFramingSuggestionsApplied(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  previousAnswers: Readonly<Record<string, string>>,
  nextAnswers: Readonly<Record<string, string>>,
): number {
  let count = 0;

  for (const question of questions) {
    const previous = previousAnswers[question.questionId]?.trim() ?? "";
    const next = nextAnswers[question.questionId]?.trim() ?? "";

    if (next.length > 0 && next !== previous) {
      count += 1;
    }
  }

  return count;
}
