import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureIntelligenceFramingQuestion } from "@/lib/architecture/architecture-intelligence-framing-interview";
import {
  buildInferenceCorpus,
  extractLineValue,
  extractScopeLines,
  findSentenceMatching,
  formatMinutesLabel,
  joinBriefList,
  type FramingSuggestContext,
} from "@/lib/architecture/framing-suggest-corpus";
import {
  isConfirmedBriefEntry,
  parseQualityAttributeEntries,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { isReadableInferredClarificationAnswer } from "@/lib/inferred-clarification-answer-quality";
import { deriveStatedConstraintContextFromTexts } from "@/lib/review-quality/stated-constraint-context";

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

export function inferFramingAnswer(
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

export function acceptSuggestedAnswer(answer: string | null): string | null {
  if (answer === null) {
    return null;
  }

  const trimmed = answer.trim();

  if (trimmed.length === 0 || !isReadableInferredClarificationAnswer(trimmed)) {
    return null;
  }

  return trimmed;
}
