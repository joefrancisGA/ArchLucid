import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import type {
  CompareGovernanceDiffView,
  CompareManifestGovernanceSnapshot,
} from "@/lib/compare-effective-governance-diff";

export type ComparePackAssignmentSide = {
  readonly label: string;
  readonly summaryLine: string;
};

export type ComparePackAssignmentDeltaView = {
  readonly baseline: ComparePackAssignmentSide;
  readonly target: ComparePackAssignmentSide;
  readonly changed: boolean;
  readonly wk21Line: string;
};

function formatPackAssignmentSummary(snapshot: CompareManifestGovernanceSnapshot): string {
  const atCommitPacks = snapshot.atCommit?.packAssignments ?? [];

  if (atCommitPacks.length > 0) {
    return atCommitPacks
      .map((row) => {
        const version = row.policyPackVersion.trim();

        return version.length > 0 ? `${row.policyPackId}@${version}` : row.policyPackId;
      })
      .join(" · ");
  }

  const ruleSetId = snapshot.ruleSetId?.trim() ?? "";

  if (ruleSetId.length === 0) {
    return "No pack assignment recorded";
  }

  const ruleSetVersion = snapshot.ruleSetVersion?.trim() ?? "";

  return ruleSetVersion.length > 0 ? `${ruleSetId} @ ${ruleSetVersion}` : ruleSetId;
}

/** Compact compare pack-assignment delta for verdict chrome — WK-21 honesty included. */
export function buildComparePackAssignmentDeltaView(
  view: CompareGovernanceDiffView | null,
): ComparePackAssignmentDeltaView | null {
  if (view === null) {
    return null;
  }

  const baselineLine = formatPackAssignmentSummary(view.baselineManifest);
  const targetLine = formatPackAssignmentSummary(view.targetManifest);
  const bothEmpty =
    baselineLine === "No pack assignment recorded" && targetLine === "No pack assignment recorded";

  if (bothEmpty && view.manifestRuleSetChanges.length === 0) {
    return null;
  }

  return {
    baseline: {
      label: "Baseline review",
      summaryLine: baselineLine,
    },
    target: {
      label: "Updated review",
      summaryLine: targetLine,
    },
    changed: baselineLine !== targetLine || view.manifestRuleSetChanges.length > 0,
    wk21Line: POLICY_PACK_INFLUENCE_HONESTY_LINE,
  };
}
