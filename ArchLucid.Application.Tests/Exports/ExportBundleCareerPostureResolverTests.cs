using ArchLucid.Application.Exports;
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
}
