using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DrRpoRequirementParserTests
{
    [Fact]
    public void TryParseRecoveryObjectives_parses_rpo_minutes_from_text()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["text"] = "Payment SQL must meet RPO 15 min for disaster recovery.",
        };

        bool parsed = DrRpoRequirementParser.TryParseRecoveryObjectives(
            "DR objective",
            properties,
            out int? rpoMinutes,
            out int? rtoMinutes);

        parsed.Should().BeTrue();
        rpoMinutes.Should().Be(15);
        rtoMinutes.Should().BeNull();
    }

    [Fact]
    public void TryParseRecoveryObjectives_returns_false_when_no_objective_present()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["text"] = "Application must be highly available.",
        };

        DrRpoRequirementParser.TryParseRecoveryObjectives(
                "Availability",
                properties,
                out int? rpoMinutes,
                out int? rtoMinutes)
            .Should().BeFalse();

        rpoMinutes.Should().BeNull();
        rtoMinutes.Should().BeNull();
    }
}
