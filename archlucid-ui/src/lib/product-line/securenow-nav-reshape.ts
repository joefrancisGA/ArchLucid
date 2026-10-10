import { Home } from "lucide-react";

import {
  AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  SECURENOW_AUDIT_EVIDENCE_PATH,
} from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
  SECURENOW_REMEDIATION_INSTANCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_REMEDIATION_FACTORY_PATH,
  GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_JIRA_PATH,
  INTEGRATIONS_SERVICENOW_PATH,
  INTEGRATIONS_TEAMS_PATH,
} from "@/lib/integrations-nav-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import type { NavGroupConfig, NavLinkItem } from "@/lib/nav-config.types";

import type { ProductLineNavGroupRow } from "@/lib/product-line/filter-nav-groups-for-product-line";
import { SECURENOW_INFRASTRUCTURE_DRIFT_LABEL } from "@/lib/product-line/securenow-infrastructure-home-copy";

export const SECURENOW_HOME_NAV_GROUP_ID = "securenow-home" as const;
export const SECURENOW_FINDINGS_NAV_GROUP_ID = "securenow-findings" as const;
export const SECURENOW_ENVIRONMENT_NAV_GROUP_ID = "securenow-environment" as const;
export const SECURENOW_REMEDIATION_NAV_GROUP_ID = "securenow-remediation" as const;
export const SECURENOW_COMPLIANCE_NAV_GROUP_ID = "securenow-compliance" as const;
export const SECURENOW_DATA_SOURCES_NAV_GROUP_ID = "securenow-data-sources" as const;
export const SECURENOW_INTEGRATION_NAV_GROUP_ID = "securenow-integrations" as const;
export const SECURENOW_INTEGRATION_NAV_GROUP_LABEL = "Integrations" as const;
export const SECURENOW_AZURE_CONNECTIONS_NAV_LABEL = "Azure connections" as const;

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

export const SECURENOW_FINDINGS_NAV_HREFS: readonly string[] = [
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
];

export const SECURENOW_ENVIRONMENT_NAV_HREFS: readonly string[] = [
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
];

export const SECURENOW_REMEDIATION_NAV_HREFS: readonly string[] = [
  GOVERNANCE_REMEDIATION_FACTORY_PATH,
  GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
];

export const SECURENOW_COMPLIANCE_NAV_HREFS: readonly string[] = [
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
];

export const SECURENOW_DATA_SOURCES_NAV_HREFS: readonly string[] = [
  CLOUD_CONNECTIONS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
];

export const SECURENOW_INTEGRATION_NAV_HREFS: readonly string[] = [
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

const SECURENOW_COMPLIANCE_NAV_HREF_BY_GOVERNANCE_HREF: Readonly<Record<string, string>> = {
  [GOVERNANCE_POLICY_PACKS_PATH]: SECURENOW_POLICY_PACKS_PATH,
  [GOVERNANCE_STANDARDS_AND_RULES_PATH]: SECURENOW_STANDARDS_AND_RULES_PATH,
  [GOVERNANCE_FINDINGS_PATH]: SECURENOW_FINDINGS_PATH,
  [AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH]: SECURENOW_AUDIT_EVIDENCE_PATH,
};

const SECURENOW_SECURITY_NAV_HREF_BY_GOVERNANCE_HREF: Readonly<Record<string, string>> = {
  [GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH]: SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
  [GOVERNANCE_REMEDIATION_FACTORY_PATH]: SECURENOW_REMEDIATION_FACTORY_PATH,
  [GOVERNANCE_REMEDIATION_PATTERNS_PATH]: SECURENOW_REMEDIATION_PATTERNS_PATH,
  [GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH]: SECURENOW_REMEDIATION_INSTANCES_PATH,
};

const SECURENOW_INFRASTRUCTURE_NAV_HREF_BY_GOVERNANCE_HREF: Readonly<Record<string, string>> = {
  [GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH]: SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  [GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH]: SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
  [GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH]: SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
  [GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH]: SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  [GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH]: SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
  [GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH]: SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  [GOVERNANCE_INFRASTRUCTURE_ASK_PATH]: SECURENOW_INFRASTRUCTURE_ASK_PATH,
  [GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH]: SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
};

function remapSecureNowComplianceNavLink(link: NavLinkItem): NavLinkItem {
  const remappedHref = SECURENOW_COMPLIANCE_NAV_HREF_BY_GOVERNANCE_HREF[link.href];

  if (remappedHref === undefined) {
    return link;
  }

  return {
    ...link,
    href: remappedHref,
    ...(link.href === GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH ||
    link.href === SECURENOW_INFRASTRUCTURE_DRIFT_PATH
      ? { label: SECURENOW_INFRASTRUCTURE_DRIFT_LABEL }
      : {}),
  };
}

function remapSecureNowSecurityNavLink(link: NavLinkItem): NavLinkItem {
  const remappedHref = SECURENOW_SECURITY_NAV_HREF_BY_GOVERNANCE_HREF[link.href];

  if (remappedHref === undefined) {
    return link;
  }

  return {
    ...link,
    href: remappedHref,
  };
}

function remapSecureNowInfrastructureNavLink(link: NavLinkItem): NavLinkItem {
  const remappedHref = SECURENOW_INFRASTRUCTURE_NAV_HREF_BY_GOVERNANCE_HREF[link.href];

  if (remappedHref === undefined) {
    return link;
  }

  return {
    ...link,
    href: remappedHref,
  };
}

function buildSecureNowNavGroup(
  id:
    | typeof SECURENOW_HOME_NAV_GROUP_ID
    | typeof SECURENOW_FINDINGS_NAV_GROUP_ID
    | typeof SECURENOW_ENVIRONMENT_NAV_GROUP_ID
    | typeof SECURENOW_REMEDIATION_NAV_GROUP_ID
    | typeof SECURENOW_COMPLIANCE_NAV_GROUP_ID
    | typeof SECURENOW_DATA_SOURCES_NAV_GROUP_ID
    | typeof SECURENOW_INTEGRATION_NAV_GROUP_ID,
  label: string,
  caption: string | undefined,
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

/** SecureNow shell — groups destinations around the security architect workflow. */
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

  const reshaped: ProductLineNavGroupRow[] = [];

  reshaped.push(
    buildSecureNowNavGroup(
      SECURENOW_HOME_NAV_GROUP_ID,
      "Overview",
      undefined,
      [SECURENOW_SECURITY_HOME_LINK],
      sourceGroup,
    ),
  );

  const findingsLinks = pickNavLinks(linksByHref, SECURENOW_FINDINGS_NAV_HREFS).map((link) =>
    link.href === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH
      ? remapSecureNowSecurityNavLink(link)
      : remapSecureNowComplianceNavLink(link),
  );

  if (findingsLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_FINDINGS_NAV_GROUP_ID,
        "Findings",
        "What needs attention, and who owns it.",
        findingsLinks,
        sourceGroup,
      ),
    );
  }

  const environmentLinks = pickNavLinks(linksByHref, SECURENOW_ENVIRONMENT_NAV_HREFS).map(
    remapSecureNowInfrastructureNavLink,
  );

  if (environmentLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_ENVIRONMENT_NAV_GROUP_ID,
        "Environment",
        "What you have and how it connects.",
        environmentLinks,
        sourceGroup,
      ),
    );
  }

  const remediationLinks = pickNavLinks(linksByHref, SECURENOW_REMEDIATION_NAV_HREFS).map(
    remapSecureNowSecurityNavLink,
  );

  if (remediationLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_REMEDIATION_NAV_GROUP_ID,
        "Remediation",
        "What to fix first, and whether it worked.",
        remediationLinks,
        sourceGroup,
      ),
    );
  }

  const complianceLinks = pickNavLinks(linksByHref, SECURENOW_COMPLIANCE_NAV_HREFS).map(
    remapSecureNowComplianceNavLink,
  );

  if (complianceLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_COMPLIANCE_NAV_GROUP_ID,
        "Compliance",
        "Frameworks, effective rules, and audit evidence.",
        complianceLinks,
        sourceGroup,
      ),
    );
  }

  const dataSourceLinks = [
    ...applySecureNowIntegrationNavLinkLabels(
      pickNavLinks(linksByHref, [CLOUD_CONNECTIONS_PATH]),
    ),
    ...pickNavLinks(linksByHref, SECURENOW_DATA_SOURCES_NAV_HREFS.slice(1)).map((link) =>
      link.href === ADMINISTRATION_CONNECTION_STATUS_PATH
        ? link
        : remapSecureNowInfrastructureNavLink(link),
    ),
  ];

  if (dataSourceLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_DATA_SOURCES_NAV_GROUP_ID,
        "Data sources",
        "Where SecureNow's evidence comes from.",
        dataSourceLinks,
        sourceGroup,
      ),
    );
  }

  const integrationLinks = pickNavLinks(linksByHref, SECURENOW_INTEGRATION_NAV_HREFS);

  if (integrationLinks.length > 0) {
    reshaped.push(
      buildSecureNowNavGroup(
        SECURENOW_INTEGRATION_NAV_GROUP_ID,
        "Integrations",
        "Where findings and fixes are sent.",
        integrationLinks,
        sourceGroup,
      ),
    );
  }

  const tailRows = rows
    .filter((row) => !SECURENOW_SOURCE_GROUP_IDS.has(row.group.id))
    .map((row) => {
      if (row.group.id !== "operator-admin") {
        return row;
      }

      const visibleLinks = row.visibleLinks.filter(
        (link) => link.href !== ADMINISTRATION_CONNECTION_STATUS_PATH,
      );

      return {
        ...row,
        group: { ...row.group, links: visibleLinks },
        visibleLinks,
      };
    })
    .filter((row) => row.visibleLinks.length > 0);

  return [...reshaped, ...tailRows];
}
