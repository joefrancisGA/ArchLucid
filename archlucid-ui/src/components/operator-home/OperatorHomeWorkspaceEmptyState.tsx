import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_HOME_REVIEWS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** First-run workspace with no review packages — compact enterprise empty pattern; CTAs live in the hero above. */
export function OperatorHomeWorkspaceEmptyState() {
  return <EnterpriseCompactEmptyState {...OPERATOR_HOME_REVIEWS_EMPTY_COMPACT} />;
}
