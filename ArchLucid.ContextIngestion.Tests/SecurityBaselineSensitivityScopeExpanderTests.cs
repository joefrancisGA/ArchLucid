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
}
