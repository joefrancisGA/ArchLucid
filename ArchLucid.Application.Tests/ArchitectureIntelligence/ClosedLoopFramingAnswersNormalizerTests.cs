using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopFramingAnswersNormalizerTests
{
    [Fact]
    public void Normalize_trims_keys_and_values_and_uses_ordinal_keys()
    {
        Dictionary<string, string> framingAnswers = new(StringComparer.Ordinal)
        {
            [" scope "] = "  security  ",
        };

        Dictionary<string, string> normalized = ClosedLoopFramingAnswersNormalizer.Normalize(framingAnswers);

        normalized.Should().ContainKey("scope");
        normalized["scope"].Should().Be("security");
    }

    [Fact]
    public void Normalize_prefers_substantive_value_when_duplicate_keys_differ_only_by_casing()
    {
        Dictionary<string, string> framingAnswers = new(StringComparer.Ordinal)
        {
            ["Scope"] = "   ",
            ["scope"] = "security",
        };

        Dictionary<string, string> normalized = ClosedLoopFramingAnswersNormalizer.Normalize(framingAnswers);

        normalized.Should().ContainKey("scope");
        normalized["scope"].Should().Be("security");
    }
}
