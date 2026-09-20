import type { InfraEvidenceMermaidOutline, InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

/** Mirrors backend {@link AzureInventoryNeverShowArmTypes} for diagram outline filtering. */
const CATALOG_ARM_TYPES: readonly string[] = [
  "Microsoft.Portal/dashboards",
  "Microsoft.OperationalInsights/workspaces",
  "Microsoft.Insights/activityLogAlerts",
  "Microsoft.Insights/metricAlerts",
  "Microsoft.Insights/workbooks",
  "Microsoft.Insights/scheduledQueryRules",
  "Microsoft.AlertsManagement/smartDetectorAlertRules",
  "Microsoft.OperationsManagement/solutions",
  "Microsoft.Network/dnszones",
  "Microsoft.Network/privateDnsZones",
  "Microsoft.Network/dnsResolvers",
  "Microsoft.Network/firewallPolicies",
  "Microsoft.Network/networkIntentPolicies",
  "Microsoft.Network/networkWatchers",
  "Microsoft.Network/networkWatchers/flowLogs",
  "Microsoft.ManagedIdentity/userAssignedIdentities",
  "Microsoft.Automation/automationAccounts",
  "Microsoft.Automation/automationAccounts/runbooks",
  "Microsoft.Compute/virtualMachines/extensions",
  "Microsoft.Compute/virtualMachineScaleSets/extensions",
  "Microsoft.Compute/sshPublicKeys",
  "Microsoft.HybridCompute/machines/extensions",
  "Microsoft.Maintenance/maintenanceConfigurations",
  "Microsoft.Maintenance/configurationAssignments",
  "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
  "Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks",
  "Microsoft.Network/virtualNetworks/virtualNetworkPeerings",
];

const SQL_DATABASE_ARM_TYPE_PREFIXES: readonly string[] = [
  "Microsoft.Sql/servers/databases",
  "Microsoft.Sql/managedInstances/databases",
];

const NEVER_SHOW_SQL_DATABASE_NAMES: readonly string[] = ["master"];

const LAST_SEGMENTS: readonly string[] = [
  "dashboards",
  "workspaces",
  "activitylogalerts",
  "metricalerts",
  "workbooks",
  "scheduledqueryrules",
  "smartdetectoralertrules",
  "solutions",
  "extensions",
  "sshpublickeys",
  "dnssettings",
  "dnszones",
  "privatednszones",
  "dnsresolvers",
  "firewallpolicies",
  "networkintentpolicies",
  "networkwatchers",
  "flowlogs",
  "userassignedidentities",
  "automationaccounts",
  "runbooks",
  "versions",
  "virtualnetworklinks",
  "virtualnetworkpeerings",
  "maintenanceconfigurations",
  "configurationassignments",
];

function readLastSegment(value: string): string {
  const segments = value.split("/").filter((segment) => segment.trim().length > 0);

  return segments[segments.length - 1] ?? value;
}

export function shouldOmitAzureInventoryNeverShowArmType(armType: string | null | undefined): boolean {
  if (armType == null) {
    return false;
  }

  const trimmed = armType.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (CATALOG_ARM_TYPES.some((catalogType) => catalogType.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0)) {
    return true;
  }

  const lastSegment = readLastSegment(trimmed).toLowerCase();

  return LAST_SEGMENTS.some((segment) => segment === lastSegment);
}

export function shouldOmitAzureInventoryNeverShowSqlDatabaseName(
  resourceType: string | null | undefined,
  resourceName: string | null | undefined,
): boolean {
  if (!isSqlDatabaseResourceType(resourceType)) {
    return false;
  }

  const trimmedName = resourceName?.trim() ?? "";

  if (trimmedName.length === 0) {
    return false;
  }

  const normalizedName = trimmedName.toLowerCase();

  return NEVER_SHOW_SQL_DATABASE_NAMES.some((databaseName) => databaseName === normalizedName);
}

function isSqlDatabaseResourceType(resourceType: string | null | undefined): boolean {
  const trimmed = resourceType?.trim() ?? "";

  if (trimmed.length === 0) {
    return false;
  }

  return SQL_DATABASE_ARM_TYPE_PREFIXES.some(
    (prefix) => trimmed.localeCompare(prefix, undefined, { sensitivity: "accent" }) === 0
      || trimmed.toLowerCase().startsWith(`${prefix.toLowerCase()}/`),
  );
}

export function shouldOmitInfraEvidenceOutlineNode(node: InfraEvidenceMermaidOutlineNode): boolean {
  if (shouldOmitAzureInventoryNeverShowArmType(node.resourceType)) {
    return true;
  }

  return shouldOmitAzureInventoryNeverShowSqlDatabaseName(node.resourceType, node.label);
}

export function filterInfraEvidenceMermaidOutline(
  outline: InfraEvidenceMermaidOutline,
  includeNeverShow: boolean,
): InfraEvidenceMermaidOutline {
  if (includeNeverShow) {
    return outline;
  }

  const visibleNodes = outline.nodes.filter((node) => !shouldOmitInfraEvidenceOutlineNode(node));
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = outline.edges.filter(
    (edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to),
  );

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
  };
}
