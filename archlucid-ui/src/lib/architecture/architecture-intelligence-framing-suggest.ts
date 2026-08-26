import {
  isConfirmedBriefEntry,
  parseQualityAttributeEntries,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureIntelligenceFramingQuestion } from "@/lib/architecture/architecture-intelligence-framing-interview";
import { isReadableInferredClarificationAnswer } from "@/lib/inferred-clarification-answer-quality";
import { deriveStatedConstraintContextFromTexts } from "@/lib/review-quality/stated-constraint-context";

export type FramingSuggestContext = {
  readonly combinedSourceText: string;
  readonly businessOutcome?: string;
  readonly structuredBrief?: ArchitectureDraftStructuredBriefState;
};

function splitSentences(corpus: string): readonly string[] {
  return corpus
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function truncateSentenceAtWordBoundary(sentence: string, maxLength = 320): string {
  if (sentence.length <= maxLength) {
    return sentence;
  }

  const slice = sentence.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    return slice.slice(0, lastSpace).trimEnd();
  }

  return slice.trimEnd();
}

function findSentenceMatching(corpus: string, patterns: readonly RegExp[]): string | null {
  for (const sentence of splitSentences(corpus)) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      return truncateSentenceAtWordBoundary(sentence);
    }
  }

  return null;
}

function formatMinutesLabel(minutes: number): string {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;

    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function joinBriefList(items: readonly string[]): string | null {
  const confirmed = items.filter((item) => isConfirmedBriefEntry(item));

  if (confirmed.length === 0) {
    return null;
  }

  return confirmed.join("; ");
}

function buildInferenceCorpus(context: FramingSuggestContext): string {
  const parts: string[] = [];
  const overview = context.combinedSourceText.trim();

  if (overview.length > 0) {
    parts.push(overview);
  }

  const outcome = context.businessOutcome?.trim() ?? "";

  if (outcome.length > 0) {
    parts.push(`Business outcome: ${outcome}`);
  }

  const brief = context.structuredBrief;

  if (brief !== undefined) {
    const constraints = joinBriefList(brief.confirmedConstraints);

    if (constraints !== null) {
      parts.push(`Constraints: ${constraints}`);
    }

    const assumptions = joinBriefList(brief.confirmedAssumptions);

    if (assumptions !== null) {
      parts.push(`Assumptions: ${assumptions}`);
    }

    const capabilities = joinBriefList(brief.confirmedRequiredCapabilities);

    if (capabilities !== null) {
      parts.push(`Required capabilities: ${capabilities}`);
    }

    const qualityAttributes = joinBriefList(parseQualityAttributeEntries(brief.qualityAttribute));

    if (qualityAttributes !== null) {
      parts.push(`Quality attributes: ${qualityAttributes}`);
    }

    const failureMode = brief.failureModeNote.trim();

    if (isConfirmedBriefEntry(failureMode)) {
      parts.push(`Failure mode and recovery: ${failureMode}`);
    }
  }

  return parts.join("\n\n");
}

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

function extractScopeLines(combinedText: string): string | null {
  const lower = combinedText.toLowerCase();
  const inScope = extractLineValue(combinedText, "in scope");
  const outOfScope = extractLineValue(combinedText, "out of scope");
  const parts: string[] = [];

  if (inScope !== null && inScope.length > 0) {
    parts.push(`In scope: ${inScope}`);
  }

  if (outOfScope !== null && outOfScope.length > 0) {
    parts.push(`Out of scope: ${outOfScope}`);
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (lower.includes("in scope") || lower.includes("out of scope")) {
    return findSentenceMatching(combinedText, [/\b(?:in|out of)\s+scope\b/i]);
  }

  const parsed = parseArchitectureGeneratedContent(combinedText);
  const scopeSection = parsed.sections.find((section) => section.key === "scope");
  const systemsSection = parsed.sections.find((section) => section.key === "systems-and-services");
  const integrationsSection = parsed.sections.find((section) => section.key === "external-integrations");

  if (scopeSection !== undefined) {
    const narrative = scopeSection.narrativeMarkdown?.trim() ?? "";
    const entityLabels = scopeSection.entities.map((entity) => entity.label).join("; ");

    if (narrative.length > 0 && entityLabels.length > 0) {
      return `${narrative} · ${entityLabels}`;
    }

    if (narrative.length > 0) {
      return narrative;
    }

    if (entityLabels.length > 0) {
      return entityLabels;
    }
  }

  const insideLabels: string[] = [];
  const outsideLabels: string[] = [];

  if (systemsSection !== undefined) {
    for (const entity of systemsSection.entities) {
      insideLabels.push(entity.label);
    }
  }

  if (integrationsSection !== undefined) {
    for (const entity of integrationsSection.entities) {
      outsideLabels.push(entity.label);
    }
  }

  if (insideLabels.length > 0 || outsideLabels.length > 0) {
    const parts: string[] = [];

    if (insideLabels.length > 0) {
      parts.push(`Inside: ${insideLabels.join("; ")}`);
    }

    if (outsideLabels.length > 0) {
      parts.push(`Outside integrations: ${outsideLabels.join("; ")}`);
    }

    return parts.join(" ");
  }

  return null;
}

function inferBusinessOutcome(context: FramingSuggestContext): string | null {
  const outcome = context.businessOutcome?.trim() ?? "";

  if (outcome.length > 0) {
    return outcome;
  }

  const corpus = buildInferenceCorpus(context);
  const parsed = parseArchitectureGeneratedContent(corpus);
  const outcomeSection = parsed.sections.find((section) => section.key === "business-outcome");

  if (outcomeSection !== undefined) {
    const narrative = outcomeSection.narrativeMarkdown?.trim() ?? "";

    if (narrative.length > 0) {
      return narrative;
    }
  }

  if (corpus.toLowerCase().includes("business outcome")) {
    return extractLineValue(corpus, "business outcome");
  }

  return findSentenceMatching(corpus, [
    /\b(?:business outcome|business goal|primary objective|must deliver|success criteria)\b/i,
  ]);
}

function inferSystemBoundary(context: FramingSuggestContext): string | null {
  const corpus = buildInferenceCorpus(context);
  const scopeAnswer = extractScopeLines(corpus);

  if (scopeAnswer !== null && scopeAnswer.length > 0) {
    return scopeAnswer;
  }

  const brief = context.structuredBrief;
  const capabilities = brief === undefined ? null : joinBriefList(brief.confirmedRequiredCapabilities);

  if (capabilities !== null) {
    return `Required capabilities in scope: ${capabilities}`;
  }

  if (corpus.toLowerCase().includes("system boundary")) {
    return extractLineValue(corpus, "system boundary");
  }

  return findSentenceMatching(corpus, [
    /\b(?:system boundary|trust boundary|scope boundary|boundary of the system)\b/i,
  ]);
}

function inferFixedDecisions(context: FramingSuggestContext): string | null {
  const brief = context.structuredBrief;
  const constraints = brief === undefined ? null : joinBriefList(brief.confirmedConstraints);

  if (constraints !== null) {
    return constraints;
  }

  const corpus = buildInferenceCorpus(context);
  const parsed = parseArchitectureGeneratedContent(corpus);
  const constraintsSection = parsed.sections.find((section) => section.key === "constraints");

  if (constraintsSection !== undefined) {
    const narrative = constraintsSection.narrativeMarkdown?.trim() ?? "";
    const entityLabels = constraintsSection.entities.map((entity) => entity.label).join("; ");

    if (narrative.length > 0 && entityLabels.length > 0) {
      return `${narrative} · ${entityLabels}`;
    }

    if (entityLabels.length > 0) {
      return entityLabels;
    }

    if (narrative.length > 0) {
      return narrative;
    }
  }

  if (corpus.toLowerCase().includes("fixed decision")) {
    return extractLineValue(corpus, "fixed decision");
  }

  return null;
}

function inferCriticalQualityAttributes(context: FramingSuggestContext): string | null {
  const brief = context.structuredBrief;
  const qualityAttributes =
    brief === undefined
      ? null
      : joinBriefList(parseQualityAttributeEntries(brief.qualityAttribute));

  if (qualityAttributes !== null) {
    return qualityAttributes;
  }

  const corpus = buildInferenceCorpus(context);
  const lower = corpus.toLowerCase();

  if (lower.includes("availability") || lower.includes("security")) {
    const stated = deriveStatedConstraintContextFromTexts([corpus]);
    const parts: string[] = [];

    const uptimeMatch = /\b99(?:\.\d+)?%\s*(?:uptime|availability)\b/i.exec(corpus);

    if (uptimeMatch !== null) {
      parts.push(uptimeMatch[0]);
    }

    if (stated.rtoMinutes !== null) {
      parts.push(`RTO ${formatMinutesLabel(stated.rtoMinutes)}`);
    }

    if (stated.rpoMinutes !== null) {
      parts.push(`RPO ${formatMinutesLabel(stated.rpoMinutes)}`);
    }

    if (parts.length > 0) {
      return parts.join("; ");
    }

    return "Availability and security called out in source material.";
  }

  return findSentenceMatching(corpus, [
    /\b(?:availability|latency|throughput|RTO|RPO|security|performance|scalability)\b/i,
  ]);
}

function inferUnacceptableFailures(context: FramingSuggestContext): string | null {
  const brief = context.structuredBrief;
  const failureMode = brief?.failureModeNote.trim() ?? "";

  if (isConfirmedBriefEntry(failureMode)) {
    return failureMode;
  }

  const corpus = buildInferenceCorpus(context);
  const lower = corpus.toLowerCase();

  if (lower.includes("unacceptable")) {
    return extractLineValue(corpus, "unacceptable");
  }

  if (lower.includes("must not fail")) {
    return "Must-not-fail constraints referenced in source material.";
  }

  const failureModeLine = extractLineValue(corpus, "failure mode");

  if (failureModeLine !== null && failureModeLine.length > 0) {
    return failureModeLine;
  }

  const parsed = parseArchitectureGeneratedContent(corpus);
  const risksSection = parsed.sections.find((section) => section.key === "risks");

  if (risksSection !== undefined) {
    const narrative = risksSection.narrativeMarkdown?.trim() ?? "";
    const entityLabels = risksSection.entities.map((entity) => entity.label).join("; ");

    if (narrative.length > 0 && entityLabels.length > 0) {
      return `${narrative} · ${entityLabels}`;
    }

    if (entityLabels.length > 0) {
      return entityLabels;
    }

    if (narrative.length > 0) {
      return narrative;
    }
  }

  return findSentenceMatching(corpus, [
    /\b(?:unacceptable|must not fail|cannot tolerate|zero tolerance|single point of failure)\b/i,
  ]);
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

function inferRecoveryObjectiveEvidence(corpus: string): string | null {
  const stated = deriveStatedConstraintContextFromTexts([corpus]);
  const parts: string[] = [];

  if (stated.rtoMinutes !== null) {
    parts.push(`RTO ${formatMinutesLabel(stated.rtoMinutes)}`);
  }

  if (stated.rpoMinutes !== null) {
    parts.push(`RPO ${formatMinutesLabel(stated.rpoMinutes)}`);
  }

  const uptimeMatch = /\b99(?:\.\d+)?%\s*(?:uptime|availability)\b/i.exec(corpus);

  if (uptimeMatch !== null) {
    parts.push(uptimeMatch[0]);
  }

  if (parts.length > 0) {
    return parts.join("; ");
  }

  return findSentenceMatching(corpus, [
    /\b(?:RTO|RPO|recovery objective|recovery time|recovery point|disaster recovery|backup|failover)\b/i,
  ]);
}

function inferCostDriverEvidence(corpus: string): string | null {
  const stated = deriveStatedConstraintContextFromTexts([corpus]);

  if (stated.monthlyCostCeilingUsd !== null) {
    return `Monthly cost ceiling about $${stated.monthlyCostCeilingUsd.toLocaleString("en-US")}.`;
  }

  return findSentenceMatching(corpus, [
    /\b(?:cost driver|cost drivers|budget|cost constraint|cost ceiling|operating cost|monthly spend)\b/i,
    /\$\s*[\d,]+(?:\.\d+)?\s*(?:\/\s*month|per month|monthly)\b/i,
    /\bfinops\b.*\b(?:budget|cost|spend|ceiling|driver)\b/i,
    /\b(?:budget|cost|spend|ceiling|driver)\b.*\bfinops\b/i,
  ]);
}

function isGapStatement(answer: string): boolean {
  const lower = answer.toLowerCase();

  return (
    lower.startsWith("no ") ||
    lower.includes("not documented") ||
    lower.includes("cannot be verified") ||
    lower.includes("missing") ||
    lower.includes("insufficient")
  );
}

function inferEvidenceDrivenAnswer(
  question: ArchitectureIntelligenceFramingQuestion,
  corpus: string,
): string | null {
  const inferred = question.inferredAnswer?.trim() ?? "";

  if (
    inferred.length > 0 &&
    !isGapStatement(inferred) &&
    isReadableInferredClarificationAnswer(inferred)
  ) {
    return inferred;
  }

  const prompt = question.prompt.toLowerCase();

  if (prompt.includes("recovery objective") || prompt.includes("rto") || prompt.includes("rpo")) {
    return inferRecoveryObjectiveEvidence(corpus);
  }

  if (prompt.includes("cost driver") || prompt.includes("cost")) {
    return inferCostDriverEvidence(corpus);
  }

  if (prompt.includes("security") || prompt.includes("trust boundary")) {
    return findSentenceMatching(corpus, [
      /\b(?:PII|PHI|PCI(?:-DSS)?|HIPAA|GDPR|SOC\s*2|trust boundary|data sensitivity|regulated)\b/i,
    ]);
  }

  return findSentenceMatching(corpus, [/\b(?:evidence|documented|stated|constraint|assumption)\b/i]);
}

function inferFramingAnswer(
  question: ArchitectureIntelligenceFramingQuestion,
  context: FramingSuggestContext,
): string | null {
  const corpus = buildInferenceCorpus(context);
  const questionId = question.questionId;

  if (questionId.startsWith("evidence-") || question.source === "EvidenceDriven") {
    return inferEvidenceDrivenAnswer(question, corpus);
  }

  switch (questionId) {
    case "business-outcome":
      return inferBusinessOutcome(context);
    case "system-boundary":
      return inferSystemBoundary(context);
    case "fixed-decisions":
      return inferFixedDecisions(context);
    case "critical-quality-attributes":
      return inferCriticalQualityAttributes(context);
    case "unacceptable-failures":
      return inferUnacceptableFailures(context);
    case "architecture-kind":
      return inferArchitectureKind(corpus);
    default:
      return inferEvidenceDrivenAnswer(question, corpus);
  }
}

function acceptSuggestedAnswer(answer: string | null): string | null {
  if (answer === null) {
    return null;
  }

  const trimmed = answer.trim();

  if (trimmed.length === 0 || !isReadableInferredClarificationAnswer(trimmed)) {
    return null;
  }

  return trimmed;
}

/** Deterministic framing suggestions from overview text — mirrors server inference (no LLM spend). */
export function suggestFramingAnswersFromOverview(
  questions: readonly ArchitectureIntelligenceFramingQuestion[],
  context: FramingSuggestContext,
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  for (const question of questions) {
    const inferred = acceptSuggestedAnswer(inferFramingAnswer(question, context));
    const confirmed = question.confirmedAnswer?.trim() ?? "";

    if (inferred !== null) {
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
