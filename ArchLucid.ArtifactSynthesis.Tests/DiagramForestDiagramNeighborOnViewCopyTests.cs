using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestDiagramNeighborOnViewCopyTests
{
    [Fact]
    public void FormatNeighborCountStatus_zero_includes_not_stored_connection_claim()
    {
        DiagramForestDiagramNeighborOnViewCopy.FormatNeighborCountStatus(0)
            .Should()
            .Contain(DiagramForestDiagramNeighborOnViewCopy.NoNeighborNotStoredConnectionClaim);
    }

    [Fact]
    public void FormatNeighborCountStatus_non_zero_includes_isolation_disclaimer()
    {
        DiagramForestDiagramNeighborOnViewCopy.FormatNeighborCountStatus(2)
            .Should()
            .Contain(DiagramForestDiagramNeighborOnViewCopy.IsolationDisclaimer);
    }
}
