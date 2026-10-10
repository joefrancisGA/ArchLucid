import type { NavLinkItem } from "@/lib/nav-config.types";

const SECURENOW_NAV_LABELS: Readonly<Record<string, string>> = {
  "/": "Home",
  "/security/assigned-to-me": "My findings",
  "/compliance/findings": "All findings",
  "/infrastructure/resources": "Resources",
  "/infrastructure/diagrams": "Diagrams",
  "/infrastructure/diagram-reconcile": "Diagram reconciliation",
  "/infrastructure/snapshots-drift": "Changes & drift",
  "/infrastructure/ask": "Ask about your environment",
  "/infrastructure/terraform": "Terraform mapping",
  "/security/remediation-factory": "Priorities & waves",
  "/security/remediation-patterns": "Fix playbooks",
  "/security/remediation-instances": "Remediation tracker",
  "/compliance/policy-packs": "Frameworks",
  "/compliance/standards-and-rules": "Effective rules",
  "/compliance/audit-evidence": "Audit evidence",
  "/integrations/cloud-connections": "Azure connections",
  "/infrastructure/declared-connections": "Declared connections",
  "/administration/connection-status": "Connection status",
  "/infrastructure/extract-upload": "Manual upload",
  "/integrations/jira": "Jira",
  "/integrations/servicenow": "ServiceNow",
  "/integrations/teams": "Microsoft Teams",
};

export function applySecureNowNavLabel(link: NavLinkItem): NavLinkItem {
  const label = SECURENOW_NAV_LABELS[link.href];

  if (label === undefined) {
    return link;
  }

  return {
    ...link,
    label,
  };
}
