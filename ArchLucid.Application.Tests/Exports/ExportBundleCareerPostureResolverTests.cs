using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExportBundleCareerPostureResolverTests
{
    [Fact]
    public void ResolveFromDeltasJson_blocks_simulator_working_career_without_door_stamp()
    {
        string json =
            """
            {"isDemoTenant":false,"structuralExecutionMode":"Simulator","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(json);

        result.IsBlocked.Should().BeTrue();
        result.BlockReason.Should().Be(SimulatorCareerHonestyPresenter.SimulatorRehearsalBlockedMessage);
        result.Stamp.Should().BeNull();
    }

    [Fact]
    public void ResolveFromDeltasJson_stamps_rehearsal_when_simulator_rehearsal_door()
    {
        string json =
            """
            {"isDemoTenant":false,"structuralExecutionMode":"Simulator","workingCareerRehearsalDoor":"rehearsal","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(json);

        result.IsBlocked.Should().BeFalse();
        result.Stamp.Should().NotBeNull();
        result.Stamp!.CareerPosture.Should().Be(ExportBundleCareerPostureResolver.CareerPostureRehearsal);
        result.Stamp.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
        result.Stamp.RehearsalIncomplete.Should().BeTrue();
    }

    [Fact]
    public void ResolveFromDeltasJson_stamps_career_for_real_mode()
    {
        string json =
            """
            {"isDemoTenant":false,"structuralExecutionMode":"Real","workingCareerRehearsalDoor":"career","proofPackageCompleteness":{"runInCommittedStatus":true}}
            """;

        ExportBundleCareerPostureResult result = ExportBundleCareerPostureResolver.ResolveFromDeltasJson(json);

        result.IsBlocked.Should().BeFalse();
        result.Stamp!.CareerPosture.Should().Be(ExportBundleCareerPostureResolver.CareerPostureCareer);
        result.Stamp.RehearsalIncomplete.Should().BeFalse();
    }

    [Fact]
    public void ResolveTriageFromRunFields_returns_null_when_no_stamp_fields()
    {
        ExportBundleCareerPostureTriageResult? result =
            ExportBundleCareerPostureResolver.ResolveTriageFromRunFields(null, null);

        result.Should().BeNull();
    }

    [Fact]
    public void ResolveTriageFromRunFields_marks_career_blocked_for_simulator_career_door()
    {
        ExportBundleCareerPostureTriageResult? result =
            ExportBundleCareerPostureResolver.ResolveTriageFromRunFields(
                StructuralExecutionMode.Simulator,
                WorkingCareerRehearsalDoorValues.Career);

        result.Should().NotBeNull();
        result!.CareerPostureLabel.Should().Be(ExportBundleCareerPostureResolver.CareerPostureCareerBlocked);
        result.CareerBlocked.Should().BeTrue();
        result.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Career);
    }

    [Fact]
    public void ResolveTriageFromRunFields_stamps_rehearsal_for_simulator_rehearsal_door()
    {
        ExportBundleCareerPostureTriageResult? result =
            ExportBundleCareerPostureResolver.ResolveTriageFromRunFields(
                StructuralExecutionMode.Simulator,
                WorkingCareerRehearsalDoorValues.Rehearsal);

        result.Should().NotBeNull();
        result!.CareerPostureLabel.Should().Be(ExportBundleCareerPostureResolver.CareerPostureRehearsal);
        result.RehearsalIncomplete.Should().BeTrue();
        result.CareerBlocked.Should().BeFalse();
    }
}
