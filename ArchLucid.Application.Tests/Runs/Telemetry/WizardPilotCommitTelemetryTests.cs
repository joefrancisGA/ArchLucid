using ArchLucid.Application.Runs.Telemetry;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Telemetry;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WizardPilotCommitTelemetryTests
{
    [Theory]
    [InlineData("wizard", true)]
    [InlineData("Wizard", true)]
    [InlineData("cli", false)]
    [InlineData(null, false)]
    public void ShouldRecord_matches_request_source(string? requestSource, bool expected)
    {
        ArchitectureRequest request = new() { RequestSource = requestSource };

        WizardPilotCommitTelemetry.ShouldRecord(request).Should().Be(expected);
    }

    [Fact]
    public void ComputeElapsedMinutesUtc_clamps_negative_deltas_to_zero()
    {
        DateTime created = new(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime committed = created.AddMinutes(-5);

        WizardPilotCommitTelemetry.ComputeElapsedMinutesUtc(created, committed).Should().Be(0);
    }

    [Fact]
    public void NormalizePresetUsed_maps_known_tokens_and_unknown_fallback()
    {
        WizardPilotCommitTelemetry.NormalizePresetUsed("greenfield").Should().Be("greenfield");
        WizardPilotCommitTelemetry.NormalizePresetUsed(" legacy ").Should().Be("unknown");
        WizardPilotCommitTelemetry.NormalizePresetUsed(null).Should().Be("unknown");
    }

    [Fact]
    public void NormalizeExecutionMode_uses_lowercase_enum_name()
    {
        WizardPilotCommitTelemetry.NormalizeExecutionMode(StructuralExecutionMode.Real).Should().Be("real");
    }

    [Fact]
    public void RecordIfWizardSourced_skips_non_wizard_requests()
    {
        ArchitectureRequest request = new() { RequestSource = "cli" };
        RunRecord runRecord = new()
        {
            CreatedUtc = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        Action act = () =>
            WizardPilotCommitTelemetry.RecordIfWizardSourced(
                request,
                runRecord,
                new DateTime(2026, 6, 1, 12, 15, 0, DateTimeKind.Utc));

        act.Should().NotThrow();
    }
}
