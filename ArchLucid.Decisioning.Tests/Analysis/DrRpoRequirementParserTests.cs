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

    [Fact]
    public void TryParseRecoveryObjectives_parses_under_hour_phrase_from_architecture_request()
    {
        // templates/architecture-requests/cloud-migration-lift-and-shift.json constraint.
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["text"] = "Restore RPO under 1 hour for the transactional database",
        };

        bool parsed = DrRpoRequirementParser.TryParseRecoveryObjectives(
            "Restore objective",
            properties,
            out int? rpoMinutes,
            out int? rtoMinutes);

        parsed.Should().BeTrue();
        rpoMinutes.Should().Be(60);
        rtoMinutes.Should().BeNull();
    }

    [Fact]
    public void TryParseRecoveryObjectives_parses_comparison_targets_from_multi_region_request()
    {
        // templates/architecture-requests/multi-region-ha.json description.
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["text"] = "Target RTO < 5 minutes, RPO < 30 seconds for transactional data.",
        };

        bool parsed = DrRpoRequirementParser.TryParseRecoveryObjectives(
            "Failover objective",
            properties,
            out int? rpoMinutes,
            out int? rtoMinutes);

        parsed.Should().BeTrue();
        rtoMinutes.Should().Be(5);
        // 30 seconds is a positive sub-minute bound, so the integer minute budget rounds up to 1.
        rpoMinutes.Should().Be(1);
    }

    [Fact]
    public void TryParseRecoveryObjectives_parses_day_unit_as_twenty_four_hours()
    {
        // Draft intake copies the quality attribute onto a requirement. The quality-attribute
        // materializer maps "1 day" to 24 hours; this parser must not report that sentence as 1 minute.
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["text"] = "quality attribute: rpo 1 day",
        };

        bool parsed = DrRpoRequirementParser.TryParseRecoveryObjectives(
            "Availability quality attribute",
            properties,
            out int? rpoMinutes,
            out int? rtoMinutes);

        parsed.Should().BeTrue();
        rpoMinutes.Should().Be(1440);
        rtoMinutes.Should().BeNull();
    }
}
