namespace ArchLucid.AzureLabGenerator;

public sealed class AzureLabInventoryGenerator
{
    public const int LandingZoneResourceCount = 500;
    public const int LandingZoneLaterResourceCount = 500;
    public const int MessyEstateResourceCount = 50;

    private const string LandingZoneSubscriptionId = "55555555-5555-5555-5555-555555555555";
    private const string MessyEstateSubscriptionId = "66666666-6666-6666-6666-666666666666";

    private static readonly string[] ResourceGroups =
    [
        "lz-connectivity",
        "lz-identity",
        "lz-management",
        "lz-app-01",
        "lz-app-02",
        "lz-app-03",
        "lz-app-04",
        "lz-app-05",
        "lz-app-06",
        "lz-app-07",
        "lz-app-08",
        "lz-app-09",
        "lz-app-10",
        "lz-app-11",
        "lz-app-12",
        "lz-app-13",
    ];

    private static readonly (string Prefix, string Type)[] ResourceTypes =
    [
        ("vnet", "Microsoft.Network/virtualNetworks"),
        ("pe", "Microsoft.Network/privateEndpoints"),
        ("agw", "Microsoft.Network/applicationGateways"),
        ("aks", "Microsoft.ContainerService/managedClusters"),
        ("app", "Microsoft.Web/sites"),
        ("sql", "Microsoft.Sql/servers/databases"),
        ("kv", "Microsoft.KeyVault/vaults"),
        ("st", "Microsoft.Storage/storageAccounts"),
        ("law", "Microsoft.OperationalInsights/workspaces"),
        ("vm", "Microsoft.Compute/virtualMachines"),
        ("disk", "Microsoft.Compute/disks"),
    ];

    public IReadOnlyList<AzureLabResource> Build(AzureLabScenarioId scenarioId)
    {
        return scenarioId switch
        {
            AzureLabScenarioId.LandingZone => BuildLandingZone(),
            AzureLabScenarioId.LandingZoneLater => BuildLandingZoneLater(),
            AzureLabScenarioId.MessyEstate => BuildMessyEstate(),
            _ => throw new ArgumentOutOfRangeException(nameof(scenarioId), scenarioId, "Unknown Azure lab scenario."),
        };
    }

    public IReadOnlyList<AzureLabResource> BuildLandingZone()
    {
        List<AzureLabResource> resources = [];

        for (int groupIndex = 0; groupIndex < ResourceGroups.Length; groupIndex++)
        {
            string resourceGroup = ResourceGroups[groupIndex];
            string location = groupIndex % 2 == 0 ? "eastus" : "westus2";
            int resourceCount = groupIndex == ResourceGroups.Length - 1 ? 35 : 31;

            for (int index = 0; index < resourceCount; index++)
            {
                (string prefix, string type) = ResourceTypes[(groupIndex + index) % ResourceTypes.Length];
                resources.Add(CreateResource(LandingZoneSubscriptionId, resourceGroup, location, prefix, type, index + 1));
            }
        }

        return resources;
    }

    public IReadOnlyList<AzureLabResource> BuildLandingZoneLater()
    {
        List<AzureLabResource> resources = BuildLandingZone().Take(LandingZoneResourceCount - 15).ToList();

        for (int index = 1; index <= 15; index++)
        {
            resources.Add(CreateResource(
                LandingZoneSubscriptionId,
                "lz-app-new",
                "eastus",
                "added-app",
                "Microsoft.Web/sites",
                index));
        }

        return resources;
    }

    public IReadOnlyList<AzureLabResource> BuildMessyEstate()
    {
        List<AzureLabResource> resources = [];

        for (int index = 1; index <= 44; index++)
        {
            (string prefix, string type) = ResourceTypes[(index - 1) % 10];
            string resourceGroup = index % 2 == 0 ? "MessyPrimaryRg" : "MessySecondaryRg";
            string location = index == 4 ? string.Empty : index % 3 == 0 ? "westus2" : "eastus";
            resources.Add(CreateResource(MessyEstateSubscriptionId, resourceGroup, location, prefix, type, index));
        }

        resources.Add(CreateResource(MessyEstateSubscriptionId, "MessyPrimaryRg", "eastus", "duplicate", "Microsoft.Web/sites", 1, "duplicate-name"));
        resources.Add(CreateResource(MessyEstateSubscriptionId, "MessySecondaryRg", "westus2", "duplicate", "Microsoft.Web/sites", 1, "duplicate-name"));
        resources.Add(CreateResource(MessyEstateSubscriptionId, "MessyPrimaryRg", "eastus", "private-endpoint", "Microsoft.Network/privateEndpoints", 1, "pe-missing-target-1"));
        resources.Add(CreateResource(MessyEstateSubscriptionId, "MessyPrimaryRg", "eastus", "unknown", "Microsoft.Contoso/widgets", 1, "unknown-widget-1", true));
        resources.Add(CreateResource(MessyEstateSubscriptionId, "MessyPrimaryRg", "eastus", "storage", "Microsoft.Storage/storageAccounts", 1, new string('a', 180)));
        resources.Add(CreateResource(MessyEstateSubscriptionId, "MessyPrimaryRg", "eastus", "network", "Microsoft.Network/virtualNetworks", 1, "Nätverk-テスト"));

        return resources;
    }

    private static AzureLabResource CreateResource(
        string subscriptionId,
        string resourceGroup,
        string location,
        string prefix,
        string type,
        int index,
        string? nameOverride = null,
        bool isUnknownType = false)
    {
        string name = nameOverride ?? $"{prefix}-{resourceGroup}-{index}";

        // Full ARM ids let the existing package readers derive resource scope and group.
        string id = $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/{type}/{name}";

        return new AzureLabResource(id, name, type, type, location, resourceGroup, isUnknownType ? true : null);
    }
}
