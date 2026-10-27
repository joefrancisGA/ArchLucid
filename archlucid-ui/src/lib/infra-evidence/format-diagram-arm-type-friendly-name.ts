const KNOWN_ARM_TYPE_FRIENDLY_NAMES: Readonly<Record<string, string>> = {
  "Microsoft.Compute/virtualMachines": "Virtual machine",
  "Microsoft.Compute/virtualMachineScaleSets": "VM scale set",
  "Microsoft.Compute/disks": "Disk",
  "Microsoft.Network/virtualNetworks": "Virtual network",
  "Microsoft.Network/networkInterfaces": "Network interface",
  "Microsoft.Network/networkSecurityGroups": "Network security group",
  "Microsoft.Network/publicIPAddresses": "Public IP",
  "Microsoft.Network/loadBalancers": "Load balancer",
  "Microsoft.Network/privateEndpoints": "Private endpoint",
  "Microsoft.Sql/servers": "SQL server",
  "Microsoft.Sql/servers/databases": "SQL database",
  "Microsoft.Sql/managedInstances": "SQL managed instance",
  "Microsoft.Storage/storageAccounts": "Storage account",
  "Microsoft.KeyVault/vaults": "Key vault",
  "Microsoft.Web/sites": "App Service",
  "Microsoft.Web/serverFarms": "App Service plan",
  "Microsoft.DocumentDB/databaseAccounts": "Cosmos DB",
  "Microsoft.Cache/Redis": "Redis cache",
  "Microsoft.ContainerService/managedClusters": "Kubernetes cluster",
  "Microsoft.DBforPostgreSQL/flexibleServers": "PostgreSQL",
  "Microsoft.DBforPostgreSQL/servers": "PostgreSQL",
  "Microsoft.DBforMySQL/flexibleServers": "MySQL",
  "Microsoft.DBforMySQL/servers": "MySQL",
  "Microsoft.DataFactory/factories": "Data factory",
  "Microsoft.Synapse/workspaces": "Synapse workspace",
  "Microsoft.Databricks/workspaces": "Databricks workspace",
  "Microsoft.PowerBIDedicated/capacities": "Power BI capacity",
  "Microsoft.Fabric/capacities": "Fabric capacity",
  "Microsoft.Logic/workflows": "Logic App",
  "Microsoft.Web/connections": "Logic App connection",
  "Microsoft.Web/staticSites": "Static Web App",
};

function splitCamelCase(lastSegment: string): string {
  const trimmed = lastSegment.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  const characters: string[] = [];

  for (let index = 0; index < trimmed.length; index += 1) {
    const current = trimmed[index];
    const previous = index > 0 ? trimmed[index - 1] : "";

    if (index > 0 && current >= "A" && current <= "Z" && (previous < "A" || previous > "Z")) {
      characters.push(" ");
    }

    characters.push(index === 0 ? current.toUpperCase() : current.toLowerCase());
  }

  return characters.join("");
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/u)
    .filter((word) => word.length > 0)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

export const DIAGRAM_ARM_TYPE_UNMAPPED_CAPTION_PREFIX =
  "ARM resource type has no reviewer label:" as const;

export function isDiagramArmTypeKnownCatalog(armType: string | null | undefined): boolean {
  if (armType == null) {
    return false;
  }

  const trimmed = armType.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return Object.keys(KNOWN_ARM_TYPE_FRIENDLY_NAMES).some(
    (key) => key.toLowerCase() === trimmed.toLowerCase(),
  );
}

/** Outline tables — do not invent camelCase labels for types outside the known catalog. */
export function formatDiagramArmTypeForOutline(armType: string | null | undefined): string {
  if (armType == null || armType.trim().length === 0) {
    return "Resource type was not stored.";
  }

  const trimmed = armType.trim();
  const friendly = formatDiagramArmTypeFriendlyName(trimmed);

  if (isDiagramArmTypeKnownCatalog(trimmed) && friendly != null) {
    return friendly;
  }

  return `${DIAGRAM_ARM_TYPE_UNMAPPED_CAPTION_PREFIX} ${trimmed}`;
}

/** Mirrors backend <see cref="DiagramArmTypeFriendlyName" /> with title-cased words for operator tables. */
export function formatDiagramArmTypeFriendlyName(armType: string | null | undefined): string | null {
  if (armType == null) {
    return null;
  }

  const trimmed = armType.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const normalizedKey = Object.keys(KNOWN_ARM_TYPE_FRIENDLY_NAMES).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase(),
  );
  const known = normalizedKey != null ? KNOWN_ARM_TYPE_FRIENDLY_NAMES[normalizedKey] : null;

  if (known != null) {
    return titleCaseWords(known);
  }

  const segments = trimmed.split("/").filter((segment) => segment.length > 0);
  const lastSegment = segments[segments.length - 1] ?? trimmed;

  return titleCaseWords(splitCamelCase(lastSegment));
}
