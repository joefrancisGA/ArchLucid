import { Home } from "lucide-react";

import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH, INTEGRATIONS_JIRA_PATH, INTEGRATIONS_SERVICENOW_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import type { NavGroupConfig, NavLinkItem } from "@/lib/nav-config.types";

import type { ProductLineNavGroupRow } from "@/lib/product-line/filter-nav-groups-for-product-line";
import { SECURENOW_COMPLIANCE_NAV_GROUP_LABEL } from "@/lib/product-line/securenow-compliance-home-copy";

export const SECURENOW_COMPLIANCE_NAV_GROUP_ID = "operate-compliance" as const;
export const SECURENOW_INTEGRATION_NAV_GROUP_ID = "operate-integration" as const;
export const SECURENOW_INTEGRATION_NAV_GROUP_LABEL = "Integration" as const;
export const SECURENOW_AZURE_CONNECTIONS_NAV_LABEL = "Azure connections" as const;
export const SECURENOW_SECURITY_NAV_GROUP_ID = "operate-security" as const;

/** SecureNow Security shell — pilot Home is filtered out before reshape, so inject it here. */
export const SECURENOW_SECURITY_HOME_LINK: NavLinkItem = {
  href: "/",
  label: OPERATOR_NAV_LINK_LABELS.home,
  title: "Workspace home",
  icon: Home,
  tier: "extended",
  requiredAuthority: "ReadAuthority",
};

const SECURENOW_SOURCE_GROUP_IDS = new Set([
  "operate-policy",
  "operate-governance",
  "operate-infrastructure",
  "operate-integrations",
]);

/** SecureNow sidebar — compliance posture destinations in display order. */
export const SECURENOW_COMPLIANCE_NAV_HREFS: readonly string[] = [
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  GOVERNANCE_FINDINGS_PATH,
  AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
];

/** SecureNow sidebar — operational security destinations in display order. */
export const SECURENOW_SECURITY_NAV_HREFS: readonly string[] = [
  "/governance/findings/assigned-to-me",
  "/governance/remediation-factory",
  "/governance/remediation-patterns",
];

/** SecureNow sidebar — Azure inventory and outbound ticketing integrations in display order. */
export const SECURENOW_INTEGRATION_NAV_HREFS: readonly string[] = [
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_TEAMS_PATH,
];

function collectNavLinks(rows: readonly ProductLineNavGroupRow[]): Map<string, NavLinkItem> {
  const linksByHref = new Map<string, NavLinkItem>();

  for (const row of rows) {
    for (const link of row.visibleLinks) {
      linksByHref.set(link.href, link);
    }
  }

  return linksByHref;
}

function pickNavLinks(
  linksByHref: ReadonlyMap<string, NavLinkItem>,
  hrefs: readonly string[],
): NavLinkItem[] {
  const links: NavLinkItem[] = [];

  for (const href of hrefs) {
    const link = linksByHref.get(href);

    if (link !== undefined) {
      links.push(link);
    }
  }

  return links;
}

function applySecureNowIntegrationNavLinkLabels(links: readonly NavLinkItem[]): NavLinkItem[] {
  return links.map((link) => {
    if (link.href !== CLOUD_CONNECTIONS_PATH) {
      return link;
    }

    return {
      ...link,
      label: SECURENOW_AZURE_CONNECTIONS_NAV_LABEL,
      title: link.title.replaceAll(OPERATOR_NAV_LINK_LABELS.cloudConnections, SECURENOW_AZURE_CONNECTIONS_NAV_LABEL),
    };
  });
}

function buildSecureNowNavGroup(
  id:
    | typeof SECURENOW_COMPLIANCE_NAV_GROUP_ID
    | typeof SECURENOW_INTEGRATION_NAV_GROUP_ID
    | typeof SECURENOW_SECURITY_NAV_GROUP_ID,
  label: string,
  caption: string,
  links: readonly NavLinkItem[],
  sourceGroup: NavGroupConfig,
): ProductLineNavGroupRow {
  return {
    group: {
      id,
      label,
      surface: sourceGroup.surface,
      caption,
      links: [...links],
    },
    visibleLinks: [...links],
  };
}

/**
 * SecureNow shell — Security, ARC-AMPE compliance, and Infrastructure sidebar clusters replace
 * Policy, Approval, and Integrations groupings while preserving link metadata.
 */
export function reshapeNavGroupsForSecureNow(
  rows: readonly ProductLineNavGroupRow[],
): ProductLineNavGroupRow[] {
  const linksByHref = collectNavLinks(rows);
  const policyGroup = rows.find((row) => row.group.id === "operate-policy")?.group;
  const governanceGroup = rows.find((row) => row.group.id === "operate-governance")?.group;
  const infrastructureRow = rows.find((row) => row.group.id === "operate-infrastructure");
  const integrationsGroup = rows.find((row) => row.group.id === "operate-integrations")?.group;
  const sourceGroup = policyGroup ?? governanceGroup ?? integrationsGroup ?? infrastructureRow?.group;

  if (sourceGroup === undefined || infrastructureRow === undefined) {
    return [...rows];
  }

  const complianceLinks = pickNavLinks(linksByHref, SECURENOW_COMPLIANCE_NAV_HREFS);
  const securityLinks = [SECURENOW_SECURITY_HOME_LINK, ...pickNavLinks(linksByHref, SECURENOW_SECURITY_NAV_HREFS)];
  const integrationLinks = applySecureNowIntegrationNavLinkLabels(
    pickNavLinks(linksByHref, SECURENOW_INTEGRATION_NAV_HREFS),
  );

  const reshaped: ProductLineNavGroupRow[] = [];

  if (securityLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_SECURITY_NAV_GROUP_ID,
        OPERATOR_NAV_GROUP_LABELS.security,
        "Remediate assigned findings, run factory workflows, and review remediation patterns.",
        securityLinks,
        sourceGroup,
      ),
    );
  }

  if (integrationLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_INTEGRATION_NAV_GROUP_ID,
        SECURENOW_INTEGRATION_NAV_GROUP_LABEL,
        "Connect Azure inventory and outbound ticketing integrations.",
        integrationLinks,
        sourceGroup,
      ),
    );
  }

  if (complianceLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_COMPLIANCE_NAV_GROUP_ID,
        SECURENOW_COMPLIANCE_NAV_GROUP_LABEL,
        "Assign ARC-AMPE packs, review effective rules, triage findings, and export audit control lineage.",
        complianceLinks,
        sourceGroup,
      ),
    );
  }

  reshaped.push(infrastructureRow);

  const tailRows = rows.filter((row) => !SECURENOW_SOURCE_GROUP_IDS.has(row.group.id));

  return [...reshaped, ...tailRows];
}
