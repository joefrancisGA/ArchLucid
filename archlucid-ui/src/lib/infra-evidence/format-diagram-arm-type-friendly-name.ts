const KNOWN_ARM_TYPE_FRIENDLY_NAMES: Readonly<Record<string, string>> = {
  "Microsoft.Compute/virtualMachines": "Virtual machine",
  "Microsoft.Compute/virtualMachineScaleSets": "VM scale set",
  "Microsoft.Compute/disks": "Disk",
  "Microsoft.Network/virtualNetworks": "Virtual network",
  "Microsoft.Network/networkInterfaces": "Network interface",
  "Microsoft.Network/networkSecurityGroups": "Network security group",
  "Microsoft.Network/publicIPAddresses": "Public IP",
  "Microsoft.Network/loadBalancers": "Load balancer",
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
