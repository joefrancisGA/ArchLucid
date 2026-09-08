using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Decisioning.Tests.Analysis;

public sealed class RequirementRedundancyParserTests
{
    [Fact]
    public void TryParse_detects_zone_redundant_language()
    {
        bool parsed = RequirementRedundancyParser.TryParse(
            "Payment SQL",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = "Payment SQL must be zone-redundant.",
            },
            out RequirementRedundancyLevel level);

        parsed.Should().BeTrue();
        level.Should().Be(RequirementRedundancyLevel.Zone);
    }

    [Fact]
    public void TryParse_returns_false_when_no_redundancy_language()
    {
        bool parsed = RequirementRedundancyParser.TryParse(
            "Payment SQL",
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = "Payment SQL must be encrypted at rest.",
            },
            out RequirementRedundancyLevel level);

        parsed.Should().BeFalse();
        level.Should().Be(default);
    }
}
