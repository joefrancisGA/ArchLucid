using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryIndirectEvidenceCurrencyTests
{
    internal const string ArmId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/source";
    private const string CurrencyKey = InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency;
    private const string SourceKey = InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceSource;

    [Theory]
    [InlineData(null, "Current")]
    [InlineData("", "Current")]
    [InlineData(" ", "Current")]
    [InlineData("package/resources.json", "Current")]
    [InlineData("TERRAFORM/main.tf", "Configured")]
    [InlineData("iac/bicep", "Configured")]
    [InlineData("arm-template.json", "Configured")]
    [InlineData("telemetry/dependencies", "Observed")]
    [InlineData("observed/calls", "Observed")]
    [InlineData("log-analytics", "Observed")]
    public void Resource_reference_supplies_currency_when_resolver_returns_current(string? reference, string expected)
    {
        var (snapshot, node, edge) = Fixture(reference);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal(expected, edge.Properties[CurrencyKey]);
        Assert.Equal(edge.InferenceSource, edge.Properties[SourceKey]);
        Assert.False(node.Properties.ContainsKey(CurrencyKey));
        Assert.Same(reference, snapshot.Resources[0].SourceEvidenceReference);
    }

    [Theory]
    [InlineData(null, "terraform", "Current")]
    [InlineData("package", "telemetry", "Current")]
    [InlineData("terraform", "telemetry", "Configured")]
    [InlineData("telemetry", "terraform", "Observed")]
    public void Duplicate_normalized_arm_ids_keep_first_resource_for_edge_fallback(
        string? firstReference, string secondReference, string expected)
    {
        var (snapshot, node, edge) = Fixture(firstReference, secondReference);
        node.Properties["arm.id"] = " " + ArmId.ToUpperInvariant() + "/ ";
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal(expected, edge.Properties[CurrencyKey]);
        Assert.Equal(2, snapshot.Resources.Count);
    }

    [Theory]
    [InlineData("Current", "Configured")]
    [InlineData("Configured", "Configured")]
    [InlineData("Observed", "Observed")]
    [InlineData("Derived", "Derived")]
    [InlineData("invalid", "Configured")]
    public void Resource_fallback_only_overrides_current_node_currency(string nodeCurrency, string expected)
    {
        var (snapshot, node, edge) = Fixture("terraform");
        node.Properties[CurrencyKey] = nodeCurrency;
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal(expected, edge.Properties[CurrencyKey]);
        Assert.Equal(nodeCurrency, node.Properties[CurrencyKey]);
    }

    [Theory]
    [InlineData("Current")]
    [InlineData("Configured")]
    [InlineData("Observed")]
    [InlineData("Derived")]
    [InlineData("invalid")]
    [InlineData("")]
    public void Existing_edge_currency_is_preserved_even_when_invalid(string currency)
    {
        var (snapshot, node, edge) = Fixture("terraform");
        edge.Properties[CurrencyKey] = currency;
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal(currency, Assert.Single(edge.Properties).Value);
        Assert.False(edge.Properties.ContainsKey(SourceKey));
    }

    [Theory]
    [InlineData("inventory-observed-dependency", "ObservedFact", "Observed")]
    [InlineData("inventory-indirect-derived-relationship", "DerivedFact", "Derived")]
    [InlineData("inventory-nic-subnet", "DerivedFact", "Derived")]
    [InlineData("inventory-property-arm-id", "DerivedFact", "Configured")]
    public void Observed_and_derived_inference_precedence_is_preserved(string source, string provenance, string expected)
    {
        var (snapshot, node, edge) = Fixture("terraform");
        edge.InferenceSource = source;
        edge.ProvenanceKind = provenance;
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal(expected, edge.Properties[CurrencyKey]);
        Assert.Equal(source, edge.Properties[SourceKey]);
    }

    [Theory]
    [InlineData("missing-resource", "Current")]
    [InlineData("blank-resource-id", "Current")]
    [InlineData("missing-node-arm-id", "Current")]
    [InlineData("slash-resource-id", "Configured")]
    public void Missing_and_blank_identifiers_preserve_legacy_fallback(string scenario, string expected)
    {
        var (snapshot, node, edge) = Fixture("terraform");
        if (scenario == "missing-resource") snapshot = new();
        if (scenario is "blank-resource-id" or "slash-resource-id")
        {
            snapshot = new() { Resources = [new AzureInventoryResourceRecord
            {
                AzureResourceId = scenario == "slash-resource-id" ? "/" : " ",
                SourceEvidenceReference = "terraform",
            }] };
            node.Properties["arm.id"] = "/";
        }
        if (scenario == "missing-node-arm-id") node.Properties.Remove("arm.id");
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal(expected, edge.Properties[CurrencyKey]);
    }

    [Fact]
    public void Missing_source_node_and_uncited_edges_are_untouched()
    {
        var (snapshot, node, edge) = Fixture("terraform");
        edge.FromNodeId = "missing";
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Empty(edge.Properties);
        edge.FromNodeId = node.NodeId;
        edge.InferenceSource = "uncited";
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Empty(edge.Properties);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [], [edge]);
        Assert.Empty(edge.Properties);
    }

    [Fact]
    public void Classified_duplicate_rows_preserve_last_node_currency_and_first_edge_fallback()
    {
        var (snapshot, node, edge) = Fixture("terraform", "package", "Microsoft.Storage/storageAccounts");
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [node], [edge]);
        Assert.Equal("Current", node.Properties[CurrencyKey]);
        Assert.Equal("Configured", edge.Properties[CurrencyKey]);
    }

    internal static (AzureInventorySnapshotDetailReadModel Snapshot, GraphNode Node, GraphEdge Edge) Fixture(
        string? reference, string? duplicateReference = null, string type = "Microsoft.Network/virtualNetworks")
    {
        List<AzureInventoryResourceRecord> resources = [new()
        {
            ResourceRowId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            AzureResourceId = ArmId,
            ResourceType = type,
            SourceEvidenceReference = reference,
        }];
        if (duplicateReference is not null) resources.Add(new()
        {
            ResourceRowId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            AzureResourceId = " " + ArmId.ToUpperInvariant() + "/ ",
            ResourceType = type,
            SourceEvidenceReference = duplicateReference,
        });
        GraphNode node = new() { NodeId = "source", Properties = new() { ["arm.id"] = ArmId } };
        GraphEdge edge = new()
        {
            EdgeId = "edge", FromNodeId = "source", ToNodeId = "target", EdgeType = GraphEdgeTypes.DependsOn,
            InferenceSource = InventoryDiagramIndirectRelationshipEdgeSources.PropertyArmId,
            ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
        };
        return (new() { Resources = resources }, node, edge);
    }
}
