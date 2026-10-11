using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

public sealed class AzureInventorySnapshotGraphResolverPropertyHydrationTests
{
    private const string Subnet = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.network/virtualnetworks/vnet/subnets/app";
    private const string Subnets = "[{\"id\":\"" + Subnet + "\"}]";
    private static readonly Guid OwnerRow = Guid.Parse("00000000-0000-0000-0000-000000000001");

    private sealed record PropertyCase(string Name, string ResourceType, string Key, string? Value, string? ExpectedValue, bool Redacted = false);

    private static PropertyCase[] Cases =>
    [
        new("bastion-subnet", "Microsoft.Network/bastionHosts", "ipConfiguration.subnet.id", Subnet, Subnet),
        new("bastion-index", "Microsoft.Network/bastionHosts", "ipConfiguration.subnet.id[0]", Subnet, Subnet),
        new("bastion-sku", "Microsoft.Network/bastionHosts", "sku.name", "Developer", "Developer"),
        new("vnet-subnets", "Microsoft.Network/virtualNetworks", "subnets", Subnets, Subnets),
        new("public-ip-configuration", "Microsoft.Network/publicIPAddresses", "ipConfiguration.id", Subnet, Subnet),
        new("public-ip-nat", "Microsoft.Network/publicIPAddresses", "natGateway.id", Subnet, Subnet),
        new("firewall-configurations", "Microsoft.Network/azureFirewalls", "ipConfigurations", "[{\"subnet\":{\"id\":\"" + Subnet + "\"}}]", "[{\"subnet\":{\"id\":\"" + Subnet + "\"}}]"),
        new("firewall-management", "Microsoft.Network/azureFirewalls", "managementIpConfiguration.subnet.id", Subnet, Subnet),
        new("firewall-index", "Microsoft.Network/azureFirewalls", "ipConfiguration.subnet.id[1]", Subnet, Subnet),
        new("registry-login", "Microsoft.ContainerRegistry/registries", "loginServer", "registry.azurecr.io", "registry.azurecr.io"),
        new("container-image", "Microsoft.App/containerApps", "container.image[0]", "registry.azurecr.io/app:1", "registry.azurecr.io/app:1"),
        new("mixed-case-resource", "MICROSOFT.CONTAINERREGISTRY/REGISTRIES", "loginServer", "registry.azurecr.io", "registry.azurecr.io"),
        new("mixed-case-key", "Microsoft.App/containerApps", "ConTainer.ImAgE[0]", "registry.azurecr.io/app:1", "registry.azurecr.io/app:1"),
        new("image-other-type", "Microsoft.Storage/storageAccounts", "container.image[0]", "registry.azurecr.io/app:1", "registry.azurecr.io/app:1"),
        new("unknown-key", "Microsoft.Network/virtualNetworks", "unrelated", "value", null),
        new("wrong-type", "Microsoft.Storage/storageAccounts", "loginServer", "registry.azurecr.io", null),
        new("network-redacted", "Microsoft.Network/virtualNetworks", "subnets", Subnets, null, true),
        new("image-redacted", "Microsoft.App/containerApps", "container.image[0]", "registry.azurecr.io/app:1", null, true),
        new("network-blank", "Microsoft.Network/virtualNetworks", "subnets", " ", null),
        new("image-blank", "Microsoft.App/containerApps", "container.image[0]", " ", null),
        new("null-value", "Microsoft.App/containerApps", "container.image[0]", null, null),
        new("missing-owner", "Microsoft.Network/virtualNetworks", "subnets", Subnets, null),
        new("missing-arm", "Microsoft.App/containerApps", "container.image[0]", "registry.azurecr.io/app:1", null),
        new("hidden-owner", "Microsoft.ManagedIdentity/userAssignedIdentities", "container.image[0]", "registry.azurecr.io/app:1", null),
        new("duplicate-network", "Microsoft.Network/virtualNetworks", "subnets", "[]", Subnets),
        new("duplicate-image", "Microsoft.App/containerApps", "container.image[0]", "registry.azurecr.io/app:1", "registry.azurecr.io/app:2"),
        new("redacted-later", "Microsoft.App/containerApps", "container.image[0]", "registry.azurecr.io/app:1", "registry.azurecr.io/app:1"),
        new("case-distinct-keys", "Microsoft.Network/virtualNetworks", "subnets", Subnets, Subnets),
        new("duplicate-owner-row", "Microsoft.Network/virtualNetworks", "subnets", Subnets, Subnets),
        new("mixed-properties", "Microsoft.Network/bastionHosts", "sku.name", "Developer", "Developer"),
    ];

    public static IEnumerable<object[]> Scenarios => Cases.Select(fixture => new object[] { fixture.Name });

    [Theory]
    [MemberData(nameof(Scenarios))]
    public async Task Properties_preserve_selection_values_owner_mapping_and_duplicate_order(string scenario)
    {
        PropertyCase fixture = Cases.Single(candidate => candidate.Name == scenario);
        GraphSnapshot graph = await ResolveScenarioAsync(scenario);
        Dictionary<string, string> expected = new(StringComparer.Ordinal);
        if (fixture.ExpectedValue is not null)
            expected.Add(fixture.Key, fixture.ExpectedValue);
        if (scenario == "case-distinct-keys")
            expected.Add("SUBNETS", "[]");
        if (scenario == "mixed-properties")
            expected.Add("container.image[0]", "registry.azurecr.io/app:1");

        string[] testedKeys = [fixture.Key, "SUBNETS", "container.image[0]"];
        KeyValuePair<string, string>[] actual = graph.Nodes.SelectMany(node => node.Properties)
            .Where(property => testedKeys.Contains(property.Key, StringComparer.Ordinal)).ToArray();
        Assert.Equal(expected.OrderBy(property => property.Key, StringComparer.Ordinal), actual.OrderBy(property => property.Key, StringComparer.Ordinal));
        if (expected.Count > 0)
        {
            GraphNode owner = Assert.Single(graph.Nodes, node => node.SourceId == OwnerArmId(fixture));
            foreach (var property in expected)
                Assert.Equal(property.Value, owner.Properties[property.Key]);
        }
        if (scenario is "bastion-sku" or "mixed-properties")
        {
            InventoryDiagramConnectionStateResult state = InventoryDiagramOrphanedStateClassifier.Classify(Assert.Single(graph.Nodes), graph, false);
            Assert.NotEqual(InventoryDiagramConnectionState.Orphaned, state.State);
            Assert.Null(state.MissingRequirementMessage);
        }
        if (scenario == "hidden-owner")
            Assert.Empty(graph.Nodes);
    }

    internal static async Task<GraphSnapshot> ResolveScenarioAsync(string scenario)
    {
        PropertyCase fixture = Cases.Single(candidate => candidate.Name == scenario);
        List<AzureInventoryResourceRecord> resources = [Resource(OwnerArmId(fixture), fixture.ResourceType, OwnerRow)];
        if (scenario == "duplicate-owner-row")
            resources.Add(Resource("/subscriptions/sub/resourcegroups/rg/providers/microsoft.storage/storageaccounts/second", "Microsoft.Storage/storageAccounts", OwnerRow));
        List<AzureInventoryResourcePropertyReadModel> properties =
        [Property(scenario == "missing-owner" ? Guid.Parse("99999999-9999-9999-9999-999999999999") : OwnerRow, fixture.Key, fixture.Value, fixture.Redacted)];
        if (scenario is "duplicate-network" or "duplicate-image")
            properties.Add(Property(OwnerRow, fixture.Key, fixture.ExpectedValue));
        if (scenario == "redacted-later")
            properties.Add(Property(OwnerRow, fixture.Key, "registry.azurecr.io/app:2", true));
        if (scenario == "case-distinct-keys")
            properties.Add(Property(OwnerRow, "SUBNETS", "[]"));
        if (scenario == "mixed-properties")
            properties.Add(Property(OwnerRow, "container.image[0]", "registry.azurecr.io/app:1"));

        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId, TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                SubscriptionId = "sub", CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc),
            },
            Resources = resources, Properties = properties,
        };
        Mock<IAzureInventorySnapshotRepository> repo = new(MockBehavior.Strict);
        repo.Setup(repository => repository.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(), snapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(snapshot);
        var result = await new AzureInventorySnapshotGraphResolver(repo.Object).TryResolveGraphAsync(new ScopeContext
        {
            TenantId = snapshot.Header.TenantId, WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        }, snapshotId,
            // Normal visibility projection rejects duplicate keys before hydration. Inclusive mode
            // characterizes hydration's existing overwrite and case-sensitive key behavior directly.
            includeNeverShowArmTypes: scenario is "duplicate-network" or "duplicate-image" or "redacted-later" or "case-distinct-keys");
        Assert.True(result.Succeeded);
        return result.Graph!;
    }

    private static string OwnerArmId(PropertyCase fixture) => fixture.Name == "missing-arm" ? string.Empty
        : "/subscriptions/sub/resourcegroups/rg/providers/" + fixture.ResourceType.ToLowerInvariant() + "/owner";

    private static AzureInventoryResourceRecord Resource(string id, string type, Guid row) => new()
    {
        ResourceRowId = row, AzureResourceId = id, ResourceType = type, ResourceGroup = "rg", SubscriptionId = "sub",
    };

    private static AzureInventoryResourcePropertyReadModel Property(Guid row, string key, string? value, bool redacted = false) => new()
    {
        ResourceRowId = row, PropertyKey = key, PropertyValue = value, IsRedacted = redacted,
    };
}
