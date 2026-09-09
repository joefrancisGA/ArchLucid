using ArchLucid.KnowledgeGraph.Diagram;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredDiagramTrustBoundaryClassifierTests
{
    [Theory]
    [InlineData("Corporate network")]
    [InlineData("Private VNet")]
    [InlineData("Subscription boundary")]
    public void IsTrustBoundaryHint_returns_true_for_boundary_lane_names(string label)
    {
        StructuredDiagramTrustBoundaryClassifier.IsTrustBoundaryHint(label).Should().BeTrue();
    }

    [Theory]
    [InlineData("Legend")]
    [InlineData("Diagram key")]
    [InlineData("Notes")]
    public void IsTrustBoundaryHint_returns_false_for_decorative_lane_names(string label)
    {
        StructuredDiagramTrustBoundaryClassifier.IsTrustBoundaryHint(label).Should().BeFalse();
    }
}
