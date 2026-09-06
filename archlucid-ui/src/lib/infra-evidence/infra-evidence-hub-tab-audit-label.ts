import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

export function formatResourceHubTabLabelWithAuditScope(
  baseLabel: string,
  auditScopeActive: boolean,
  tabId?: ResourceHubTab,
): string {
  if (!auditScopeActive) {
    return baseLabel;
  }

  if (tabId === "audit") {
    return `${baseLabel} (scoped)`;
  }

  return `${baseLabel} · audit`;
}
