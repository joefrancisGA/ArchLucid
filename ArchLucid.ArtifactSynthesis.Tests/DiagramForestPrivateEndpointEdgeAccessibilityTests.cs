using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestPrivateEndpointEdgeAccessibilityTests
{
    [Fact]
    public void FormatEdgeTitle_labels_missing_private_endpoint_name()
    {
        DiagramForestPrivateEndpointEdgeAccessibility.FormatEdgeTitle(null)
            .Should()
            .Be("Private endpoint access was stored. name not stored");
    }

    [Fact]
    public void FormatEdgeTitle_includes_stored_private_endpoint_name()
    {
        DiagramForestPrivateEndpointEdgeAccessibility.FormatEdgeTitle("pe-sql")
            .Should()
            .Be("Private endpoint access was stored. pe-sql");
    }

    [Fact]
    public void FormatEdgeTitle_labels_stored_empty_private_endpoint_name()
    {
        DiagramForestPrivateEndpointEdgeAccessibility.FormatEdgeTitle(string.Empty)
            .Should()
            .Be("Private endpoint access was stored. name was stored empty.");
    }
}
