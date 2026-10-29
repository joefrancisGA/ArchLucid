using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class PilotSponsorMaterialFindingsHonestyCopyTests
{
    [Fact]
    public void FormatRelatedGraphNodeCount_uses_not_stored_when_zero()
    {
        PilotSponsorMaterialFindingsHonestyCopy.FormatRelatedGraphNodeCount(0)
            .Should()
            .Be(PilotSponsorMaterialFindingsHonestyCopy.RelatedGraphNodeIdsNotStored);
    }

    [Fact]
    public void FormatAgentExecutionTraceCount_uses_not_stored_when_zero()
    {
        PilotSponsorMaterialFindingsHonestyCopy.FormatAgentExecutionTraceCount(0)
            .Should()
            .Be(PilotSponsorMaterialFindingsHonestyCopy.AgentExecutionTraceIdsNotStored);
    }
}
