using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class PilotSponsorMaterialFindingsHonestyCopyTests
{
    [Fact]
    public void FormatRelatedGraphNodeCount_uses_stored_empty_when_zero()
    {
        PilotSponsorMaterialFindingsHonestyCopy.FormatRelatedGraphNodeCount(0)
            .Should()
            .Be(PilotSponsorMaterialFindingsHonestyCopy.RelatedGraphNodeIdsStoredEmpty);
    }

    [Fact]
    public void FormatAgentExecutionTraceCount_uses_stored_empty_when_zero()
    {
        PilotSponsorMaterialFindingsHonestyCopy.FormatAgentExecutionTraceCount(0)
            .Should()
            .Be(PilotSponsorMaterialFindingsHonestyCopy.AgentExecutionTraceIdsStoredEmpty);
    }
}
