import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

export function formatResourceHubTabLabelWithAuditScope(
  baseLabel: string,
  _auditScopeActive: boolean,
  _tabId?: ResourceHubTab,
): string {
  return baseLabel;
}
