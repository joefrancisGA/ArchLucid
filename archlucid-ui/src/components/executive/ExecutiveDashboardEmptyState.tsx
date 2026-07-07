import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ExecutiveDashboardEmptyStatePreview } from "@/components/executive/ExecutiveDashboardEmptyStatePreview";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

/** Compact empty state when portfolio metrics are not yet populated — actions live in the page hero. */
export function ExecutiveDashboardEmptyState(): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div className="space-y-4" data-testid="executive-dashboard-empty-state-region">
      <EnterpriseCompactEmptyState
        title={v.emptyStateTitle}
        description={v.emptyStateDescription}
        testId="executive-dashboard-empty-state"
      />
      <ExecutiveDashboardEmptyStatePreview />
    </div>
  );
}
