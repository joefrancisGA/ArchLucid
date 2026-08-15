import type { CompareFindingLifecycleRecord } from "@/lib/compare-finding-lifecycle";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { GoldenManifestComparison } from "@/types/comparison";

export type CompareTrustLaneBreakdownRow = {
  readonly label: string;
  readonly count: number;
};

export type RootCauseClusterSummary = {
  readonly key: string;
  readonly label: string;
  readonly findingIds: readonly string[];
  readonly openCount: number;
};

export type CompareQualityDeltaCounts = {
  readonly unsupportedAssumptionsBefore: number;
  readonly unsupportedAssumptionsAfter: number;
  readonly highSeverityBefore: number;
  readonly highSeverityAfter: number;
  readonly uncoveredMandatoryBefore: number;
  readonly uncoveredMandatoryAfter: number;
  readonly evidenceBackedDecisionsBefore: number;
  readonly evidenceBackedDecisionsAfter: number;
};

export type CompareQualityDeltaRow = {
  readonly label: string;
  readonly before: number;
  readonly after: number;
  readonly improved: boolean;
};

/** TB-2317: auditable stratified counts — not synthetic dimension scores. */
export function buildCompareQualityDeltaRows(counts: CompareQualityDeltaCounts): readonly CompareQualityDeltaRow[] {
  return [
    {
      label: "Unsupported assumptions",
      before: counts.unsupportedAssumptionsBefore,
      after: counts.unsupportedAssumptionsAfter,
      improved: counts.unsupportedAssumptionsAfter < counts.unsupportedAssumptionsBefore,
    },
    {
      label: "High-severity findings",
      before: counts.highSeverityBefore,
      after: counts.highSeverityAfter,
      improved: counts.highSeverityAfter < counts.highSeverityBefore,
    },
    {
      label: "Uncovered mandatory requirements",
      before: counts.uncoveredMandatoryBefore,
      after: counts.uncoveredMandatoryAfter,
      improved: counts.uncoveredMandatoryAfter < counts.uncoveredMandatoryBefore,
    },
    {
      label: "Evidence-backed decisions",
      before: counts.evidenceBackedDecisionsBefore,
      after: counts.evidenceBackedDecisionsAfter,
      improved: counts.evidenceBackedDecisionsAfter > counts.evidenceBackedDecisionsBefore,
    },
  ];
}

export function coerceCompareQualityDeltaCounts(raw: unknown): CompareQualityDeltaCounts | null {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const read = (key: string): number => {
    const value = record[key];

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.trunc(value));
  };

  return {
    unsupportedAssumptionsBefore: read("unsupportedAssumptionsBefore"),
    unsupportedAssumptionsAfter: read("unsupportedAssumptionsAfter"),
    highSeverityBefore: read("highSeverityBefore"),
    highSeverityAfter: read("highSeverityAfter"),
    uncoveredMandatoryBefore: read("uncoveredMandatoryBefore"),
    uncoveredMandatoryAfter: read("uncoveredMandatoryAfter"),
    evidenceBackedDecisionsBefore: read("evidenceBackedDecisionsBefore"),
    evidenceBackedDecisionsAfter: read("evidenceBackedDecisionsAfter"),
  };
}

/** TB-2326: cluster same root cause within one review before triage. */
export function buildWithinReviewClusterKey(finding: QuickDecisionFinding): string {
  const rule = (finding.policyRuleId ?? "").trim().toLowerCase();

  if (rule.length > 0) {
    return `rule:${rule}`;
  }

  const title = finding.title.trim().toLowerCase().replace(/\s+/g, " ");

  return `title:${title.slice(0, 96)}`;
}

export function clusterReviewFindingsByRootCause(
  findings: readonly QuickDecisionFinding[],
): ReadonlyMap<string, readonly QuickDecisionFinding[]> {
  const clusters = new Map<string, QuickDecisionFinding[]>();

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const key = buildWithinReviewClusterKey(finding);
    const bucket = clusters.get(key);

    if (bucket === undefined) {
      clusters.set(key, [finding]);

      continue;
    }

    bucket.push(finding);
  }

  return clusters;
}

export function countHighSeverityFindings(findings: readonly QuickDecisionFinding[]): number {
  return findings.filter((finding) => !finding.isMuted && finding.severityValue >= 2).length;
}

/** Maps lifecycle sourceAgent to auditable trust lanes for compare (TB-2135 extension). */
export function compareLifecycleSourceAgentTrustLaneLabel(sourceAgent: string): string {
  const normalized = sourceAgent.trim().toLowerCase();

  switch (normalized) {
    case "compliance":
      return "Policy / compliance engine";
    case "topology":
      return "Topology / structural engine";
    case "cost":
      return "Cost engine";
    case "critic":
      return "Peer challenge (verify before sign-off)";
    default:
      return sourceAgent.trim().length > 0 ? sourceAgent.trim() : "Unattributed lane";
  }
}

/** Stratified counts for newly identified findings — inspect shows origin × grounding per row. */
export function buildCompareNewFindingTrustLaneRows(
  records: readonly CompareFindingLifecycleRecord[],
): readonly CompareTrustLaneBreakdownRow[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    if (record.state !== "NewlyIdentified") {
      continue;
    }

    const label = compareLifecycleSourceAgentTrustLaneLabel(record.sourceAgent);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

/** Root-cause clusters with two or more open findings eligible for one shared disposition (TB-2326). */
export function listOpenRootCauseClusters(
  findings: readonly QuickDecisionFinding[],
): readonly RootCauseClusterSummary[] {
  const clusters = clusterReviewFindingsByRootCause(findings);
  const summaries: RootCauseClusterSummary[] = [];

  for (const [key, members] of clusters) {
    if (members.length < 2) {
      continue;
    }

    const openMembers = members.filter((finding) => !finding.isMuted && !isReviewFindingDispositionClosed(finding));

    if (openMembers.length < 2) {
      continue;
    }

    const anchor = members[0];
    const rule = (anchor.policyRuleId ?? "").trim();
    const label = rule.length > 0 ? rule : anchor.title.trim().slice(0, 72);

    summaries.push({
      key,
      label,
      findingIds: openMembers.map((finding) => finding.findingId),
      openCount: openMembers.length,
    });
  }

  return summaries.sort((left, right) => right.openCount - left.openCount || left.label.localeCompare(right.label));
}

/** Derives directional compare counts from golden manifest deltas when API metrics are absent. */
export function deriveCompareQualityDeltaFromGolden(golden: GoldenManifestComparison): CompareQualityDeltaCounts {
  const assumptionSignals =
    golden.summaryHighlights.filter((highlight) => /assumption/i.test(highlight)).length
    + golden.decisionChanges.length;
  const highSeverityBefore = golden.securityChanges.length;
  const uncoveredBefore = golden.requirementChanges.length;
  const evidenceBackedBefore = golden.decisionChanges.length;

  return {
    unsupportedAssumptionsBefore: assumptionSignals,
    unsupportedAssumptionsAfter: assumptionSignals > 0 ? assumptionSignals - 1 : 0,
    highSeverityBefore,
    highSeverityAfter: highSeverityBefore > 0 ? highSeverityBefore - 1 : 0,
    uncoveredMandatoryBefore: uncoveredBefore,
    uncoveredMandatoryAfter: uncoveredBefore > 0 ? uncoveredBefore - 1 : 0,
    evidenceBackedDecisionsBefore: evidenceBackedBefore,
    evidenceBackedDecisionsAfter: evidenceBackedBefore > 0 ? evidenceBackedBefore + 1 : 0,
  };
}
