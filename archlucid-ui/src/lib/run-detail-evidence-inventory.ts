import { normalizeEvidenceRefSnippet } from "@/lib/finding-evidence-ref-snippet";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { TrustEvidenceReadiness, TrustEvidenceReadinessVerdict } from "@/lib/trust-evidence-readiness";

export type RunDetailEvidenceInventoryItem = {
  readonly key: string;
  readonly sourceName: string;
  readonly kind: string;
  readonly ingestedUtc: string;
  readonly citingFindingCount: number;
};

const ARCHITECTURE_BRIEF_KEY = "__architecture-brief__";

function inferEvidenceKind(sourceName: string): string {
  const lower = sourceName.toLowerCase();

  if (lower.includes("inventory") || lower.endsWith(".zip")) {
    return "Cloud inventory";
  }

  if (lower.includes(".bicep") || lower.includes(".tf") || lower.includes("terraform")) {
    return "Infrastructure as code";
  }

  if (lower.includes("brief") || lower.endsWith(".md")) {
    return "Document";
  }

  if (lower.includes("manifest") || lower.includes("snapshot") || lower.includes("graph")) {
    return "Persisted snapshot";
  }

  return "Submitted evidence";
}

function extractSourceName(snippet: string): string {
  const leadingClause = snippet.split(/[—–]/)[0]?.trim() ?? snippet;
  const beforeColon = leadingClause.split(":")[0]?.trim() ?? leadingClause;

  return beforeColon.length > 0 ? beforeColon : snippet;
}

function addInventoryRow(
  map: Map<string, { sourceName: string; kind: string; findingIds: Set<string> }>,
  key: string,
  sourceName: string,
  kind: string,
  findingId: string,
): void {
  const existing = map.get(key);

  if (existing) {
    existing.findingIds.add(findingId);

    return;
  }

  map.set(key, {
    sourceName,
    kind,
    findingIds: new Set([findingId]),
  });
}

export function deriveRunDetailEvidenceInventory(input: {
  readonly findings: readonly QuickDecisionFinding[];
  readonly runCreatedUtc: string;
  readonly submittedArchitecturePresent: boolean;
}): RunDetailEvidenceInventoryItem[] {
  const map = new Map<string, { sourceName: string; kind: string; findingIds: Set<string> }>();

  if (input.submittedArchitecturePresent) {
    map.set(ARCHITECTURE_BRIEF_KEY, {
      sourceName: "Submitted architecture brief",
      kind: "Architecture brief",
      findingIds: new Set(),
    });
  }

  for (const finding of input.findings) {
    const snippets = finding.evidenceRefSnippets ?? [];

    if (snippets.length === 0 && (finding.evidenceRefCount ?? 0) > 0) {
      addInventoryRow(
        map,
        `__finding-record-${finding.findingId}`,
        "Evidence on finding record",
        "Persisted citation",
        finding.findingId,
      );

      continue;
    }

    for (const raw of snippets) {
      const snippet = normalizeEvidenceRefSnippet(raw) ?? raw.trim();

      if (snippet.length === 0) {
        continue;
      }

      const sourceName = extractSourceName(snippet);
      const key = sourceName.toLowerCase();

      addInventoryRow(map, key, sourceName, inferEvidenceKind(sourceName), finding.findingId);
    }
  }

  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      sourceName: value.sourceName,
      kind: value.kind,
      ingestedUtc: input.runCreatedUtc,
      citingFindingCount: value.findingIds.size,
    }))
    .sort((left, right) => left.sourceName.localeCompare(right.sourceName, undefined, { sensitivity: "base" }));
}

export function countRunDetailEvidenceInventoryItems(
  items: readonly RunDetailEvidenceInventoryItem[],
): number {
  return items.length;
}

export type EvidenceScopeCoverageInput = {
  readonly inventoryCount: number;
  readonly findingsCoverageSummaryLine: string;
  readonly linkedFindingCount: number;
  readonly openFindingCount: number;
};

/** Coverage copy for the Evidence tab header — never implies satisfied coverage when inventory is empty. */
export function deriveEvidenceScopeCoverageLine(input: EvidenceScopeCoverageInput): string {
  if (input.inventoryCount > 0) {
    return input.findingsCoverageSummaryLine;
  }

  if (input.openFindingCount > 0 && input.linkedFindingCount > 0) {
    const linkedCount = input.linkedFindingCount;
    const findingNoun = linkedCount === 1 ? "finding cites" : "findings cite";

    return `${linkedCount} open ${findingNoun} internal finding pointers — no submitted source documents are listed.`;
  }

  return "No submitted source documents are listed for this review.";
}

/** Single Evidence-tab readiness verdict — inventory gaps override a complete trust-evidence rollup. */
export function deriveEvidenceScopeReadiness(input: {
  readonly inventoryCount: number;
  readonly trustReadiness: TrustEvidenceReadiness | null;
}): { readonly verdict: TrustEvidenceReadinessVerdict; readonly headline: string } {
  if (input.inventoryCount === 0) {
    if (input.trustReadiness !== null && input.trustReadiness.verdict === "gaps") {
      return {
        verdict: "gaps",
        headline: input.trustReadiness.headline,
      };
    }

    return {
      verdict: "gaps",
      headline: "Submitted evidence inventory is empty.",
    };
  }

  if (input.trustReadiness !== null) {
    return {
      verdict: input.trustReadiness.verdict,
      headline: input.trustReadiness.headline,
    };
  }

  return {
    verdict: "complete",
    headline: "Evidence is available for review.",
  };
}
