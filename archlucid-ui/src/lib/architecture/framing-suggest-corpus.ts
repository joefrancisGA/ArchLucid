import {
  isConfirmedBriefEntry,
  parseQualityAttributeEntries,
  type ArchitectureDraftStructuredBriefState,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";

export type FramingSuggestContext = {
  readonly combinedSourceText: string;
  readonly businessOutcome?: string;
  readonly structuredBrief?: ArchitectureDraftStructuredBriefState;
};

export function splitSentences(corpus: string): readonly string[] {
  return corpus
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function truncateSentenceAtWordBoundary(sentence: string, maxLength = 320): string {
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

export function findSentenceMatching(corpus: string, patterns: readonly RegExp[]): string | null {
  for (const sentence of splitSentences(corpus)) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      return truncateSentenceAtWordBoundary(sentence);
    }
  }

  return null;
}

export function formatMinutesLabel(minutes: number): string {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;

    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function joinBriefList(items: readonly string[]): string | null {
  const confirmed = items.filter((item) => isConfirmedBriefEntry(item));

  if (confirmed.length === 0) {
    return null;
  }

  return confirmed.join("; ");
}

export function buildInferenceCorpus(context: FramingSuggestContext): string {
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

export function extractLineValue(combinedText: string, marker: string): string | null {
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

export function extractScopeLines(combinedText: string): string | null {
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
    const scopeParts: string[] = [];

    if (insideLabels.length > 0) {
      scopeParts.push(`Inside: ${insideLabels.join("; ")}`);
    }

    if (outsideLabels.length > 0) {
      scopeParts.push(`Outside integrations: ${outsideLabels.join("; ")}`);
    }

    return scopeParts.join(" ");
  }

  return null;
}
