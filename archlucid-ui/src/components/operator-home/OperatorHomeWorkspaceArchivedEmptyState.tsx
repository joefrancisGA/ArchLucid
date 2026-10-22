import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_HOME_ARCHIVED_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** Workspace Activity archived filter with no archived reviews. */
export function OperatorHomeWorkspaceArchivedEmptyState() {
  return <EnterpriseCompactEmptyState {...OPERATOR_HOME_ARCHIVED_EMPTY_COMPACT} />;
}
