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
}
