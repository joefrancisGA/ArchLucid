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

const SECURENOW_NAV_TOOLTIPS: Readonly<Record<string, string>> = {
  "/": "Your security posture at a glance.",
  "/security/assigned-to-me": "Findings assigned to you.",
  "/compliance/findings": "Every open finding in this workspace, with severity and owner.",
  "/infrastructure/resources": "Search collected resources and open each resource's evidence.",
  "/infrastructure/diagrams": "See how resources connect, by subscription or resource group.",
  "/infrastructure/diagram-reconcile": "Compare an existing diagram with what was collected.",
  "/infrastructure/snapshots-drift": "Compare two collections and see what changed.",
  "/infrastructure/ask": "Ask questions about your environment. Answers cite collected evidence.",
  "/infrastructure/terraform": "Advisory Terraform reconstructed from collected resources.",
  "/security/remediation-factory": "Rank fixes by risk reduced and group them into waves.",
  "/security/remediation-patterns": "Reusable fixes you can apply to similar findings.",
  "/security/remediation-instances": "Track each fix from planned to verified.",
  "/compliance/policy-packs":
    "Choose the frameworks and organization policies this workspace is measured against.",
  "/compliance/standards-and-rules": "See which rules apply here and why.",
  "/compliance/audit-evidence": "Trace each control to the evidence behind it.",
  "/integrations/cloud-connections": "Azure tenants and subscriptions SecureNow collects from.",
  "/infrastructure/declared-connections": "Record connections that collection cannot see.",
  "/administration/connection-status": "Health of collection and integrations.",
  "/infrastructure/extract-upload": "Upload a collection ZIP when live collection is not available.",
  "/integrations/jira": "Send findings and fixes to Jira.",
  "/integrations/servicenow": "Send findings and fixes to ServiceNow.",
  "/integrations/teams": "Post finding and fix updates to Microsoft Teams.",
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

export function applySecureNowNavTooltip(link: NavLinkItem): NavLinkItem {
  const title = SECURENOW_NAV_TOOLTIPS[link.href];

  if (title === undefined) {
    return link;
  }

  return {
    ...link,
    title,
  };
}
