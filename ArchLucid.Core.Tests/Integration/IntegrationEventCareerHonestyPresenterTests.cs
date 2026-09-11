using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class IntegrationEventCareerHonestyPresenterTests
{
    [Fact]
    public void Resolve_career_real_non_sample_sets_career_complete_true()
    {
        IntegrationEventCareerPostureFields fields = IntegrationEventCareerHonestyPresenter.Resolve(
            isSampleRun: false,
            StructuralExecutionMode.Real,
            WorkingCareerRehearsalDoorValues.Career);

        fields.CareerComplete.Should().BeTrue();
        fields.StructuralExecutionMode.Should().Be(nameof(StructuralExecutionMode.Real));
        fields.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Career);
    }

    [Fact]
    public void Resolve_simulator_career_door_sets_career_complete_false()
    {
        IntegrationEventCareerPostureFields fields = IntegrationEventCareerHonestyPresenter.Resolve(
            isSampleRun: false,
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Career);

        fields.CareerComplete.Should().BeFalse();
    }

    [Fact]
    public void Resolve_sample_run_never_sets_career_complete_true()
    {
        IntegrationEventCareerPostureFields fields = IntegrationEventCareerHonestyPresenter.Resolve(
            isSampleRun: true,
            StructuralExecutionMode.Real,
            WorkingCareerRehearsalDoorValues.Career);

        fields.CareerComplete.Should().BeFalse();
    }

    [Fact]
    public void Resolve_rehearsal_door_on_simulator_sets_career_complete_false()
    {
        IntegrationEventCareerPostureFields fields = IntegrationEventCareerHonestyPresenter.Resolve(
            isSampleRun: false,
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Rehearsal);

        fields.CareerComplete.Should().BeFalse();
        fields.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
    }
}
