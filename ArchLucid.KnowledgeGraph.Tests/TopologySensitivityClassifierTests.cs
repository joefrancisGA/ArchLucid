using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class TopologySensitivityClassifierTests
{
    [Fact]
    public void Classify_data_category_returns_data_bearing()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["category"] = GraphTopologyCategories.Data,
        };

        TopologySensitivityClassifier.Classify("sql-primary", properties)
            .Should()
            .Be(TopologySensitivityLevels.DataBearing);
    }

    [Fact]
    public void ClassifyBaselineScope_encryption_control_returns_data_bearing()
    {
        TopologySensitivityClassifier.ClassifyBaselineScope("storage-encryption-at-rest", "Encrypt data")
            .Should()
            .Be(TopologySensitivityLevels.DataBearing);
    }

    [Fact]
    public void Classify_when_category_key_uses_PascalCase_on_case_sensitive_dictionary_returns_data_bearing()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["Category"] = GraphTopologyCategories.Data,
        };

        TopologySensitivityClassifier.Classify("sql-primary", properties)
            .Should()
            .Be(TopologySensitivityLevels.DataBearing);
    }

    [Fact]
    public void Classify_when_topology_sensitivity_key_uses_PascalCase_on_case_sensitive_dictionary_returns_explicit_label()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["TopologySensitivity"] = TopologySensitivityLevels.PublicEdge,
        };

        TopologySensitivityClassifier.Classify("internal-api", properties)
            .Should()
            .Be(TopologySensitivityLevels.PublicEdge);
    }

    [Fact]
    public void Classify_when_public_network_access_key_uses_PascalCase_on_case_sensitive_dictionary_returns_public_edge()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["PublicNetworkAccess"] = "true",
        };

        TopologySensitivityClassifier.Classify("internal-service", properties)
            .Should()
            .Be(TopologySensitivityLevels.PublicEdge);
    }
}
