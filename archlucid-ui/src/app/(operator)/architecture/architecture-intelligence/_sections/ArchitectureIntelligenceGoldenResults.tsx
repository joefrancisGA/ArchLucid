import { formatCountMap } from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-client-api";
import type { GoldenArchitectureTestResult } from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureIntelligenceGoldenResultsProps = {
  result: GoldenArchitectureTestResult;
};

export function ArchitectureIntelligenceGoldenResults(props: ArchitectureIntelligenceGoldenResultsProps) {
  const { result } = props;

  return (
    <div className="space-y-3" data-testid="architecture-intelligence-golden-results">
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-golden-passed">
        Passed: {result.passed ? "Yes" : "No"}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Planted defect recall: {result.plantedDefectRecall.toFixed(2)} · False positives: {result.falsePositiveCount} ·
        Mutation changed findings: {result.mutationChangedFindings ? "Yes" : "No"}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-before-counts">
        Before counts: {formatCountMap(result.beforeCounts ?? {})}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-after-counts">
        After counts: {formatCountMap(result.afterCounts ?? {})}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-delta-counts">
        Delta counts: {formatCountMap(result.deltaCounts ?? {})}
      </p>
      {(result.categoryScores ?? []).length > 0 ? (
        <ul className="m-0 list-disc space-y-1 pl-5" data-testid="architecture-intelligence-category-scores">
          {result.categoryScores?.map((score) => (
            <li key={score.category} className={OPERATOR_TYPOGRAPHY.body}>
              {score.category}: {score.score.toFixed(2)} — {score.detail}
            </li>
          ))}
        </ul>
      ) : null}
      {result.notes ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-golden-notes">
          Notes: {result.notes}
        </p>
      ) : null}
    </div>
  );
}
