using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryMetadataPropertyConversionTests
{
    private static readonly Guid Row = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const string Target = "/subscriptions/sub/resourcegroups/rg/providers/microsoft.compute/virtualmachines/target";

    public static IEnumerable<object[]> Cases => new[] { false, true }.SelectMany(parent =>
        new[] { "normal", "redactedDuplicate", "blankDuplicate", "usableDuplicate", "missingRows", "allFiltered", "orphanRows", "unusedType", "missingNode" }
            .Select(scenario => new object[] { parent, scenario }));

    [Theory]
    [MemberData(nameof(Cases))]
    public void Metadata_conversion_preserves_filtering_missing_rows_and_exception_order(bool parent, string scenario)
    {
        var (snapshot, owner, nodes) = Fixture(parent, scenario);
        Action hydrate = parent
            ? () => AzureInventorySnapshotParentAttachmentGraphHydrator.Hydrate(snapshot, nodes)
            : () => AzureInventorySnapshotNodeRelationshipGraphHydrator.Hydrate(snapshot, nodes);
        if (scenario == "usableDuplicate") Assert.Throws<ArgumentException>(hydrate);
        else hydrate();

        string currencyKey = parent ? InventoryDiagramParentAttachmentPropertyKeys.EvidenceCurrency
            : InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency;
        string endpointKey = parent ? InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId
            : InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId;
        bool currencyExpected = scenario is not "unusedType" and not "missingNode"
            && (parent || scenario is not "missingRows" and not "orphanRows");
        Assert.Equal(currencyExpected, owner.Properties.ContainsKey(currencyKey));
        if (currencyExpected) Assert.Equal("Current", owner.Properties[currencyKey]);
        if (scenario is "normal" or "redactedDuplicate" or "blankDuplicate")
            Assert.Equal(Target, owner.Properties[endpointKey]);
        else Assert.False(owner.Properties.ContainsKey(endpointKey));
    }

    internal static (AzureInventorySnapshotDetailReadModel Snapshot, GraphNode Owner, List<GraphNode> Nodes) Fixture(bool parent, string scenario)
    {
        string type = parent ? "Microsoft.Compute/restorePointCollections" : "Microsoft.Network/connections";
        string ownerArm = "/subscriptions/sub/resourceGroups/rg/providers/" + (parent
            ? "Microsoft.Compute/restorePointCollections/owner" : "Microsoft.Network/connections/owner");
        string key = parent ? "source.id" : "virtualNetworkGateway1.id";
        List<AzureInventoryResourcePropertyReadModel> properties = [new()
        {
            ResourceRowId = scenario == "orphanRows" ? Guid.Empty : Row,
            PropertyKey = key,
            PropertyValue = scenario == "allFiltered" ? " " : Target,
        }];
        if (scenario == "missingRows") properties.Clear();
        if (scenario is "redactedDuplicate" or "blankDuplicate" or "usableDuplicate" or "unusedType") properties.Add(new()
        {
            ResourceRowId = Row,
            PropertyKey = key.ToUpperInvariant(),
            PropertyValue = scenario == "blankDuplicate" ? " " : Target,
            IsRedacted = scenario == "redactedDuplicate",
        });
        if (scenario == "allFiltered") properties.Add(new()
        {
            ResourceRowId = Row, PropertyKey = key, PropertyValue = Target, IsRedacted = true,
        });
        GraphNode owner = new() { NodeId = "owner", Properties = new() { ["arm.id"] = ownerArm, ["arm.type"] = type } };
        GraphNode target = new() { NodeId = "target", Properties = new() { ["arm.id"] = Target, ["arm.type"] = "Microsoft.Compute/virtualMachines" } };
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new() { SnapshotId = Row, CreatedUtc = new DateTime(2026, 10, 12, 0, 0, 0, DateTimeKind.Utc) },
            Resources = [new()
            {
                ResourceRowId = Row, AzureResourceId = ownerArm,
                ResourceType = scenario == "unusedType" ? "Microsoft.Network/virtualNetworks" : type,
                SourceEvidenceReference = "snapshot:source",
            }],
            Properties = properties,
        };
        return (snapshot, owner, scenario == "missingNode" ? [target] : [owner, target]);
    }
}
