using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DrRpoRequirementParserTests
{
    [Theory]
    [InlineData("hours")]
    [InlineData("days")]
    public void TryParseRecoveryObjectives_ignores_oversized_prose_duration_and_keeps_valid_target(string unit)
    {
        string label = $"RPO 79228162514264337593543950335 {unit}, RTO 5 minutes";

        DrRpoRequirementParser.TryParseRecoveryObjectives(
                label, new Dictionary<string, string>(), out int? rpoMinutes, out int? rtoMinutes)
            .Should().BeTrue();

        rpoMinutes.Should().BeNull();
        rtoMinutes.Should().Be(5);
    }

    [Fact]
    public void TryParseRecoveryObjectives_accepts_maximum_representable_minutes_from_seconds()
    {
        DrRpoRequirementParser.TryParseRecoveryObjectives(
                "RPO 128849018820 seconds", new Dictionary<string, string>(), out int? rpoMinutes, out _)
            .Should().BeTrue();

        rpoMinutes.Should().Be(int.MaxValue);
    }

    [Fact]
    public void TryParseRecoveryObjectives_binds_iso_durations_to_their_objectives()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["description"] = "Backup job runs every PT60M.",
            ["rpo"] = "PT15M",
            ["rto"] = "PT5M",
        };

        DrRpoRequirementParser.TryParseRecoveryObjectives(
                "Recovery objectives", properties, out int? rpoMinutes, out int? rtoMinutes)
            .Should().BeTrue();

        rpoMinutes.Should().Be(15);
        rtoMinutes.Should().Be(5);
    }

    [Theory]
    [InlineData("RPO and backup schedule: every PT60M")]
    [InlineData("RPO PT2147483648M")]
    public void TryParseRecoveryObjectives_rejects_uncoupled_or_out_of_range_iso_duration(string label)
    {
        DrRpoRequirementParser.TryParseRecoveryObjectives(
                label, new Dictionary<string, string>(), out int? rpoMinutes, out int? rtoMinutes)
            .Should().BeFalse();

        rpoMinutes.Should().BeNull();
        rtoMinutes.Should().BeNull();
    }

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
