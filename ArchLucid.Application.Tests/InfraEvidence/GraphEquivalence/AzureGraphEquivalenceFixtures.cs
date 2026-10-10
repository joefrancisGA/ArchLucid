using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence.GraphEquivalence;

internal sealed record AzureGraphEquivalenceCase(string Name, AzureInventorySnapshotDetailReadModel Snapshot,
    string FromArmId, string ToArmId, string EdgeType, bool IncludeHidden = false,
    bool ExpectEdge = true, string? PlaceholderArmId = null);

internal static class AzureGraphEquivalenceFixtures
{
    private const string Vnet = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
    private const string Storage = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-a";
    private const string Identity = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-a";
    private const string RemoteVnet = "/subscriptions/remote/resourceGroups/remote-rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
    private const string Pe = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a";

    public static IReadOnlyList<AzureGraphEquivalenceCase> All()
    {
        AzureInventoryResourceRecord vnet = Resource(Vnet, "Microsoft.Network/virtualNetworks", 1);
        AzureInventoryResourceRecord storage = Resource(Storage, "Microsoft.Storage/storageAccounts", 2);
        AzureInventoryResourceRecord identity = Resource(Identity, "Microsoft.ManagedIdentity/userAssignedIdentities", 3);
        AzureInventoryResourceRecord pe = Resource(Pe, "Microsoft.Network/privateEndpoints", 4);
        return
        [
            new("explicit", Snapshot([vnet, storage], [Edge(Vnet, Storage)]), Vnet, Storage, GraphEdgeTypes.DependsOn),
            new("missing-source", Snapshot([vnet], [Edge(Storage, Vnet)]), Storage, Vnet, GraphEdgeTypes.DependsOn, PlaceholderArmId: Storage),
            new("missing-target", Snapshot([vnet], [Edge(Vnet, Storage)]), Vnet, Storage, GraphEdgeTypes.DependsOn, PlaceholderArmId: Storage),
            new("nested-target", Snapshot([pe, vnet], [Edge(Pe, Vnet + "/subnets/app")]), Pe, Vnet, GraphEdgeTypes.DependsOn),
            new("hidden-default", Snapshot([vnet, identity], [Edge(Vnet, Identity)]), Vnet, Identity, GraphEdgeTypes.DependsOn, ExpectEdge: false),
            new("hidden-included", Snapshot([vnet, identity], [Edge(Vnet, Identity)]), Vnet, Identity, GraphEdgeTypes.DependsOn, IncludeHidden: true),
            new("remote-peering", Snapshot([vnet], [Edge(Vnet, RemoteVnet, GraphEdgeTypes.PeersWith)]), Vnet, RemoteVnet, GraphEdgeTypes.PeersWith),
            new("private-link-property", Snapshot([pe, storage], [], [new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = pe.ResourceRowId, PropertyKey = "privateLinkServiceId", PropertyValue = Storage,
            }]), Pe, Storage, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget),
        ];
    }

    private static AzureInventoryResourceRecord Resource(string armId, string type, int ordinal) => new()
    {
        ResourceRowId = Guid.Parse($"00000000-0000-0000-0000-{ordinal:D12}"),
        AzureResourceId = armId, ResourceType = type, ResourceGroup = "rg", SubscriptionId = "sub",
    };

    private static AzureInventoryResourceRelationshipReadModel Edge(string from, string to, string type = GraphEdgeTypes.DependsOn) => new()
    {
        FromAzureResourceId = from, ToAzureResourceId = to, RelationshipType = type,
        ProvenanceKind = ProvenanceKind.ObservedFact, InferenceSource = "captured-fixture",
    };

    private static AzureInventorySnapshotDetailReadModel Snapshot(IReadOnlyList<AzureInventoryResourceRecord> resources,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> edges,
        IReadOnlyList<AzureInventoryResourcePropertyReadModel>? properties = null) => new()
    {
        Header = new AzureInventorySnapshotRecord
        {
            SnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), SubscriptionId = "sub",
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            CreatedUtc = new DateTime(2026, 10, 9, 0, 0, 0, DateTimeKind.Utc),
        },
        Resources = resources, Relationships = edges, Properties = properties ?? [],
    };
}
