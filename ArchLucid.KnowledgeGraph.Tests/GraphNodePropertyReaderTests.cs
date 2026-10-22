using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphNodePropertyReaderTests
{
    [Fact]
    public void TryGetPropertyValue_resolves_value_when_property_key_has_surrounding_whitespace()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["  category  "] = GraphTopologyCategories.Identity,
        };

        bool found = GraphNodePropertyReader.TryGetPropertyValue(properties, "category", out string? value);

        found.Should().BeTrue();
        value.Should().Be(GraphTopologyCategories.Identity);
    }

    [Fact]
    public void TryGetPropertyValue_resolves_value_when_lookup_key_has_surrounding_whitespace()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["category"] = GraphTopologyCategories.Data,
        };

        bool found = GraphNodePropertyReader.TryGetPropertyValue(properties, "  category  ", out string? value);

        found.Should().BeTrue();
        value.Should().Be(GraphTopologyCategories.Data);
    }

    [Fact]
    public void Classify_when_category_property_key_has_surrounding_whitespace_returns_identity()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["  category  "] = GraphTopologyCategories.Identity,
        };

        TopologySensitivityClassifier.Classify("entra-app", properties)
            .Should()
            .Be(TopologySensitivityLevels.Identity);
    }
}
