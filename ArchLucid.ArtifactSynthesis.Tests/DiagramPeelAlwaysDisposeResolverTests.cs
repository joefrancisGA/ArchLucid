using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramPeelAlwaysDisposeResolverTests
{
    [Fact]
    public void Resolve_includes_catalog_always_dispose_and_suffix_matches()
    {
        DiagramPeelCatalogSnapshot catalog = DiagramPeelCatalogDefaultSeed.BuildSnapshot();
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateNode("dash-1", "Microsoft.Portal/dashboards"),
                CreateNode("ext-1", "Microsoft.Compute/virtualMachines/extensions"),
                CreateNode("dns-1", "Microsoft.Network/dnszones"),
                CreateNode("mw-1", "Microsoft.Maintenance/maintenanceConfigurations"),
                CreateNode("odd-ext", "Microsoft.Example/widgets/extensions"),
                CreateNode("vm-1", "Microsoft.Compute/virtualMachines"),
            ],
        };

        IReadOnlySet<string> types = DiagramPeelAlwaysDisposeResolver.Resolve(catalog, graph);

        types.Should().Contain("Microsoft.Portal/dashboards");
        types.Should().Contain("Microsoft.Compute/virtualMachines/extensions");
        types.Should().Contain("Microsoft.Network/dnszones");
        types.Should().Contain("Microsoft.Maintenance/maintenanceConfigurations");
        types.Should().Contain("Microsoft.Example/widgets/extensions");
        types.Should().NotContain("Microsoft.Compute/virtualMachines");
    }

    [Fact]
    public void Seed_marks_always_dispose_rows()
    {
        IReadOnlyList<DiagramPeelCatalogEntry> entries = DiagramPeelCatalogDefaultSeed.BuildEntries();

        entries.Should().Contain(entry =>
            string.Equals(entry.ArmResourceType, "Microsoft.Portal/dashboards", StringComparison.Ordinal)
            && entry.AlwaysDispose
            && entry.PeelRank == 0);
        entries.Should().Contain(entry =>
            string.Equals(entry.ArmResourceType, "Microsoft.Compute/virtualMachines/extensions", StringComparison.Ordinal)
            && entry.AlwaysDispose);
        entries.Should().NotContain(entry =>
            string.Equals(entry.ArmResourceType, "Microsoft.Compute/virtualMachines/extensions", StringComparison.Ordinal)
            && entry.PeelRank == 20);
    }

    private static GraphNode CreateNode(string nodeId, string armType)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            SourceType = "azure-inventory-snapshot",
        };
        node.Properties["arm.type"] = armType;

        return node;
    }
}
