export type AzureLabInventoryResource = {
  id: string;
  name: string;
  type: string;
  resourceType: string;
  location: string;
  resourceGroup: string;
  isUnknownType?: boolean;
};

const subscriptionIds = {
  landingZone: "55555555-5555-5555-5555-555555555555",
  messyEstate: "66666666-6666-6666-6666-666666666666",
} as const;

const resourceTypes = [
  ["vnet", "Microsoft.Network/virtualNetworks"],
  ["pe", "Microsoft.Network/privateEndpoints"],
  ["agw", "Microsoft.Network/applicationGateways"],
  ["aks", "Microsoft.ContainerService/managedClusters"],
  ["app", "Microsoft.Web/sites"],
  ["sql", "Microsoft.Sql/servers/databases"],
  ["kv", "Microsoft.KeyVault/vaults"],
  ["st", "Microsoft.Storage/storageAccounts"],
  ["law", "Microsoft.OperationalInsights/workspaces"],
  ["vm", "Microsoft.Compute/virtualMachines"],
  ["disk", "Microsoft.Compute/disks"],
] as const;

const landingZoneGroups = [
  "lz-connectivity",
  "lz-identity",
  "lz-management",
  ...Array.from({ length: 13 }, (_, index) => `lz-app-${String(index + 1).padStart(2, "0")}`),
] as const;

function createResource(
  subscriptionId: string,
  resourceGroup: string,
  location: string,
  prefix: string,
  type: string,
  index: number,
  isUnknownType?: boolean,
  nameOverride?: string,
): AzureLabInventoryResource {
  const name = nameOverride ?? `${prefix}-${resourceGroup}-${index}`;

  // Keep the ARM id complete so the existing package readers can derive scope and group.
  const id = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/${type}/${name}`;

  return { id, name, type, resourceType: type, location, resourceGroup, ...(isUnknownType ? { isUnknownType } : {}) };
}

export const AZURE_LAB_LANDING_ZONE_RESOURCE_COUNT = 500;

export function buildAzureLabLandingZoneResources(): AzureLabInventoryResource[] {
  const resources: AzureLabInventoryResource[] = [];
  const groupCounts = landingZoneGroups.map((_, index) => (index === landingZoneGroups.length - 1 ? 35 : 31));

  for (let groupIndex = 0; groupIndex < landingZoneGroups.length; groupIndex += 1) {
    const resourceGroup = landingZoneGroups[groupIndex];
    const location = groupIndex % 2 === 0 ? "eastus" : "westus2";

    if (resourceGroup === undefined) {
      continue;
    }

    for (let index = 0; index < (groupCounts[groupIndex] ?? 0); index += 1) {
      const [prefix, type] = resourceTypes[(groupIndex + index) % resourceTypes.length] ?? resourceTypes[0];
      resources.push(createResource(subscriptionIds.landingZone, resourceGroup, location, prefix, type, index + 1));
    }
  }

  return resources;
}

export const AZURE_LAB_LANDING_ZONE_DRIFT_RESOURCE_COUNT = 500;

export function buildAzureLabLandingZoneDriftResources(): AzureLabInventoryResource[] {
  const resources = buildAzureLabLandingZoneResources().slice(0, -15);

  for (let index = 1; index <= 15; index += 1) {
    resources.push(
      createResource(
        subscriptionIds.landingZone,
        "lz-app-new",
        "eastus",
        "added-app",
        "Microsoft.Web/sites",
        index,
      ),
    );
  }

  return resources;
}

export const AZURE_LAB_MESSY_ESTATE_RESOURCE_COUNT = 50;

export function buildAzureLabMessyEstateResources(): AzureLabInventoryResource[] {
  const resources: AzureLabInventoryResource[] = [];
  const types = resourceTypes.slice(0, 10);

  for (let index = 1; index <= 44; index += 1) {
    const [prefix, type] = types[(index - 1) % types.length] ?? types[0];
    const resourceGroup = index % 2 === 0 ? "MessyPrimaryRg" : "MessySecondaryRg";
    resources.push(
      createResource(
        subscriptionIds.messyEstate,
        resourceGroup,
        index === 4 ? "" : index % 3 === 0 ? "westus2" : "eastus",
        prefix,
        type,
        index,
      ),
    );
  }

  resources.push(
    createResource(subscriptionIds.messyEstate, "MessyPrimaryRg", "eastus", "duplicate", "Microsoft.Web/sites", 1, false, "duplicate-name"),
    createResource(subscriptionIds.messyEstate, "MessySecondaryRg", "westus2", "duplicate", "Microsoft.Web/sites", 1, false, "duplicate-name"),
    createResource(subscriptionIds.messyEstate, "MessyPrimaryRg", "eastus", "pe-missing-target", "Microsoft.Network/privateEndpoints", 1, false, "pe-missing-target-1"),
    createResource(
      subscriptionIds.messyEstate,
      "MessyPrimaryRg",
      "eastus",
      "unknown",
      "Microsoft.Contoso/widgets",
      1,
      true,
    ),
    createResource(
      subscriptionIds.messyEstate,
      "MessyPrimaryRg",
      "eastus",
      "a".repeat(180),
      "Microsoft.Storage/storageAccounts",
      1,
      false,
      "a".repeat(180),
    ),
    createResource(subscriptionIds.messyEstate, "MessyPrimaryRg", "eastus", "Nätverk-テスト", "Microsoft.Network/virtualNetworks", 1, false, "Nätverk-テスト"),
  );

  return resources;
}
