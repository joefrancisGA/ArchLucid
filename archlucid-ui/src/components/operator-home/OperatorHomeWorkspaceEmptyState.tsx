import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_HOME_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** First-run workspace with no review packages — compact empty pattern; primary paths live in the hero. */
export function OperatorHomeWorkspaceEmptyState() {
  return <EnterpriseCompactEmptyState {...OPERATOR_HOME_REVIEWS_EMPTY_COMPACT} />;
}
