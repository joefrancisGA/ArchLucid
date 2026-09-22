using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandAsyncLaneBReaderTests
{
    [Fact]
    public void TryReadFromSemanticScore_low_faithfulness_ratio_maps_unsupported()
    {
        AgentOutputSemanticScore semantic = new()
        {
            TraceId = "trace-1",
            AgentResultFaithfulnessSupportRatio = 0.2,
        };

        FindingSemanticSupportBand? band =
            FindingSemanticSupportBandAsyncLaneBReader.TryReadFromSemanticScore(semantic);

        band.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void TryReadFromSemanticScore_missing_ratio_returns_null()
    {
        AgentOutputSemanticScore semantic = new()
        {
            TraceId = "trace-1",
        };

        FindingSemanticSupportBandAsyncLaneBReader.TryReadFromSemanticScore(semantic).Should().BeNull();
    }
}
