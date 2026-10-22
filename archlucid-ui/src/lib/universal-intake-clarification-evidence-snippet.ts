import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";
import { isHeadingOnlyChunk, splitInferenceChunks } from "@/lib/universal-intake-inference-chunks";

const MAX_SNIPPET_LINES = 4;

const SNIPPET_LINE_PATTERNS_BY_QUESTION_KEY: Readonly<Record<string, readonly RegExp[]>> = {
  "l0.actor.additional-kinds": [
    /\b(?:API clients?|service accounts?|machine users?|partner teams?|partner integrations?|administrators?|operators?|batch jobs?|actors?)\b/i,
    /\b(?:browser|https|http|jwt|front door|apim)\b/i,
  ],
  "l0.pillar.reliability": [
    /\b(?:RTO|RPO|uptime|availability|recovery|disaster recovery|failover|high availability)\b/i,
  ],
  "l0.pillar.security": [
    /\b(?:PII|PHI|PCI(?:-DSS)?|HIPAA|GDPR|SOC\s*2|FedRAMP|trust boundary|trust edge|data sensitivity|regulated|confidential)\b/i,
    /\b(?:Entra(?:\s+ID)?|managed identity|private endpoint|Key Vault)\b/i,
  ],
  "l0.pillar.cost": [
    /\b(?:budget|cost constraint|cost ceiling|finops|monthly spend|operating cost|capacity drivers|\$)\b/i,
  ],
  "l0.pillar.operations": [
    /\b(?:on[- ]call|observability|monitoring|incident response|runbook|SRE|DevOps|OpenTelemetry|Application Insights)\b/i,
  ],
  "l0.pillar.performance": [
    /\b(?:latency|throughput|transactions per second|TPS|QPS|concurrent users|requests per second|autoscale|capacity)\b/i,
  ],
  "l0.pillar.sustainability": [
    /\b(?:sustainability|utilization|idle capacity|retention|carbon|energy efficiency)\b/i,
  ],
};

function isBoilerplateBriefLine(line: string): boolean {
  const trimmed = line.trim();

  return (
    /^System name:/i.test(trimmed)
    || /^Business outcome:/i.test(trimmed)
    || /^Architecture overview:/i.test(trimmed)
    || /^Operational owner:/i.test(trimmed)
    || /^Failure modes:/i.test(trimmed)
    || /^Actors:$/i.test(trimmed)
    || /^Confirmed (?:constraints|assumptions|required capabilities):/i.test(trimmed)
    || /^Quality attributes:/i.test(trimmed)
  );
}

function lineMatchesAnyPattern(line: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(line));
}

function collectMatchingLines(corpus: string, patterns: readonly RegExp[]): readonly string[] {
  const matches: string[] = [];

  for (const line of corpus.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || isBoilerplateBriefLine(trimmed) || isHeadingOnlyChunk(trimmed)) {
      continue;
    }

    if (lineMatchesAnyPattern(trimmed, patterns)) {
      matches.push(trimmed);
    }
  }

  return matches;
}

function collectMatchingChunks(corpus: string, patterns: readonly RegExp[]): readonly string[] {
  const matches: string[] = [];

  for (const chunk of splitInferenceChunks(corpus)) {
    if (isHeadingOnlyChunk(chunk) || isBoilerplateBriefLine(chunk)) {
      continue;
    }

    if (lineMatchesAnyPattern(chunk, patterns)) {
      matches.push(chunk);
    }
  }

  return matches;
}

/** Returns question-specific evidence lines for LLM rephrase, or null when nothing relevant exists. */
export function extractClarificationEvidenceSnippet(corpus: string, questionKey: string): string | null {
  if (questionKey === CLOUD_TARGET_QUESTION_KEY) {
    return null;
  }

  const patterns = SNIPPET_LINE_PATTERNS_BY_QUESTION_KEY[questionKey];

  if (patterns === undefined) {
    return null;
  }

  const lineMatches = collectMatchingLines(corpus, patterns);
  const chunkMatches = collectMatchingChunks(corpus, patterns);
  const combined = [...new Set([...lineMatches, ...chunkMatches])];

  if (combined.length === 0) {
    return null;
  }

  return combined.slice(0, MAX_SNIPPET_LINES).join("\n");
}
