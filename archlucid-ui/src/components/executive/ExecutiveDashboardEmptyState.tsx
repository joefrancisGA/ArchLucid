import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

/** Compact empty state when portfolio metrics are not yet populated — actions live in the page hero. */
export function ExecutiveDashboardEmptyState(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <EnterpriseCompactEmptyState
      title={v.emptyStateTitle}
      description={v.emptyStateDescription}
      testId="executive-dashboard-empty-state"
    />
  );
}
