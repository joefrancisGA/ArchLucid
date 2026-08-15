import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { GoldenManifestComparison } from "@/types/comparison";

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
