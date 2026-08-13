import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { STANDARDS_RULES_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

export function StandardsRulesEmptyState() {
  return <EnterpriseCompactEmptyState {...STANDARDS_RULES_EMPTY_COMPACT} />;
}
