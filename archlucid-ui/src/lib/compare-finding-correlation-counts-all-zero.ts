import type { CompareFindingCorrelationMetadata } from "@/lib/compare-finding-correlation";

export function compareFindingCorrelationCountsAreAllZero(metadata: CompareFindingCorrelationMetadata): boolean {
  return (
    metadata.policyRuleMatchCount
    + metadata.fuzzyMatchCount
    + metadata.unmatchedLeftCount
    + metadata.unmatchedRightCount
    === 0
  );
}