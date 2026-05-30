using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketExplanationConfidenceEvaluatorTests
{
    [Fact]
    public void ResolveDisposition_returns_hold_for_deterministic_fallback()
    {
        string json = """
            {
              "deterministicFallbackUsed": true,
              "faithfulnessSupportRatio": 0.9
            }
            """;

        PilotProofPacketExplanationConfidenceEvaluator.ResolveDisposition(json).Should().Be("HOLD");
    }

    [Fact]
    public void BuildLimitationsLine_includes_disposition_when_ratio_is_low()
    {
        string json = """
            {
              "faithfulnessSupportRatio": 0.4
            }
            """;

        string? line = PilotProofPacketExplanationConfidenceEvaluator.BuildLimitationsLine(json);

        line.Should().NotBeNull();
        line.Should().Contain("HOLD");
    }
}
