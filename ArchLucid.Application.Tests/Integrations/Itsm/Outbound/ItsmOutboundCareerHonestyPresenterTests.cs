using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;

using FluentAssertions;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundSealedManifestTestSupport;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>CG-038 — ITSM outbound summary/description rehearsal honesty.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundCareerHonestyPresenterTests
{
    [Fact]
    public void Career_real_run_has_no_honesty_stamp()
    {
        ItsmOutboundCareerHonestyStamp stamp = ItsmOutboundCareerHonestyPresenter.Resolve(
            CreateCareerRealRunSummary(Guid.NewGuid()));

        stamp.RequiresHonesty.Should().BeFalse();
        stamp.IncludeCareerCompleteCustomField.Should().BeTrue();
    }

    [Fact]
    public void Rehearsal_simulator_run_prefixes_summary_and_stamps_description()
    {
        ItsmOutboundCareerHonestyStamp stamp = ItsmOutboundCareerHonestyPresenter.Resolve(
            CreateRehearsalSimulatorRunSummary(Guid.NewGuid()));

        (string summary, string description) = ItsmOutboundCareerHonestyPresenter.Apply(
            "ArchLucid finding f-1",
            "Base description",
            stamp);

        summary.Should().StartWith(ItsmOutboundCareerHonestyPresenter.RehearsalSummaryPrefix);
        description.Should().Contain(ItsmOutboundCareerHonestyPresenter.DescriptionHeader);
        description.Should().Contain("structuralExecutionMode: Simulator");
        description.Should().Contain($"workingCareerRehearsalDoor: {WorkingCareerRehearsalDoorValues.Rehearsal}");
        description.Should().Contain($"rehearsalLabel: {ItsmOutboundCareerHonestyPresenter.RehearsalIncompleteRowLabel}");
        stamp.IncludeCareerCompleteCustomField.Should().BeFalse();
    }

    [Fact]
    public void Apply_is_idempotent_when_description_already_stamped()
    {
        ItsmOutboundCareerHonestyStamp stamp = ItsmOutboundCareerHonestyPresenter.Resolve(
            CreateRehearsalSimulatorRunSummary(Guid.NewGuid()));
        string description =
            $"{ItsmOutboundCareerHonestyPresenter.DescriptionHeader}{Environment.NewLine}existing{Environment.NewLine}{Environment.NewLine}Body";

        (string summary, string resultDescription) = ItsmOutboundCareerHonestyPresenter.Apply(
            $"{ItsmOutboundCareerHonestyPresenter.RehearsalSummaryPrefix}Summary",
            description,
            stamp);

        summary.Should().Be($"{ItsmOutboundCareerHonestyPresenter.RehearsalSummaryPrefix}Summary");
        resultDescription.Should().Be(description);
    }
}
