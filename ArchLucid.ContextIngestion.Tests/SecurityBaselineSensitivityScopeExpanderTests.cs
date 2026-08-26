using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class SecurityBaselineSensitivityScopeExpanderTests
{
    [Fact]
    public void Expand_links_baseline_to_matching_topology_sensitivity()
    {
        CanonicalObject web = new()
        {
            ObjectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            ObjectType = "TopologyResource",
            Name = "public-web",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.PublicEdge,
            },
        };
        CanonicalObject database = new()
        {
            ObjectId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            ObjectType = "TopologyResource",
            Name = "sql-db",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            },
        };
        CanonicalObject baseline = new()
        {
            ObjectType = "SecurityBaseline",
            Name = "Encrypt data at rest",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["controlId"] = "storage-encryption",
                [CanonicalGraphPropertyKeys.BaselineScope] = TopologySensitivityLevels.DataBearing,
            },
        };

        IReadOnlyList<CanonicalObject> expanded =
            SecurityBaselineSensitivityScopeExpander.Expand([web, database, baseline]);

        CanonicalObject scopedBaseline = expanded.Single(o =>
            string.Equals(o.ObjectType, "SecurityBaseline", StringComparison.OrdinalIgnoreCase));

        scopedBaseline.Properties[CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds]
            .Should()
            .Be($"obj-{database.ObjectId}");
    }

    [Fact]
    public void Expand_padded_baseline_scope_links_matching_topology()
    {
        CanonicalObject database = new()
        {
            ObjectId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            ObjectType = "TopologyResource",
            Name = "sql-db",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            },
        };
        CanonicalObject baseline = new()
        {
            ObjectType = "SecurityBaseline",
            Name = "Encrypt data at rest",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["controlId"] = "storage-encryption",
                [CanonicalGraphPropertyKeys.BaselineScope] = " data-bearing ",
            },
        };

        IReadOnlyList<CanonicalObject> expanded =
            SecurityBaselineSensitivityScopeExpander.Expand([database, baseline]);

        CanonicalObject scopedBaseline = expanded.Single(o =>
            string.Equals(o.ObjectType, "SecurityBaseline", StringComparison.OrdinalIgnoreCase));

        scopedBaseline.Properties[CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds]
            .Should()
            .Be($"obj-{database.ObjectId}");
    }

    [Fact]
    public void Expand_protected_topology_node_ids_are_stable_across_topology_list_order()
    {
        CanonicalObject firstDatabase = new()
        {
            ObjectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            ObjectType = "TopologyResource",
            Name = "sql-db-a",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            },
        };
        CanonicalObject secondDatabase = new()
        {
            ObjectId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            ObjectType = "TopologyResource",
            Name = "sql-db-b",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            },
        };
        CanonicalObject baseline = new()
        {
            ObjectType = "SecurityBaseline",
            Name = "Encrypt data at rest",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["controlId"] = "storage-encryption",
                [CanonicalGraphPropertyKeys.BaselineScope] = TopologySensitivityLevels.DataBearing,
            },
        };

        IReadOnlyList<CanonicalObject> firstOrder = SecurityBaselineSensitivityScopeExpander.Expand(
            [firstDatabase, secondDatabase, baseline]);
        IReadOnlyList<CanonicalObject> reversedOrder = SecurityBaselineSensitivityScopeExpander.Expand(
            [secondDatabase, firstDatabase, baseline]);

        string firstProtectedIds = firstOrder.Single(o =>
                string.Equals(o.ObjectType, "SecurityBaseline", StringComparison.OrdinalIgnoreCase))
            .Properties[CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds];
        string reversedProtectedIds = reversedOrder.Single(o =>
                string.Equals(o.ObjectType, "SecurityBaseline", StringComparison.OrdinalIgnoreCase))
            .Properties[CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds];

        reversedProtectedIds.Should().Be(firstProtectedIds);
        firstProtectedIds.Split(',', StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(2);
    }
}
