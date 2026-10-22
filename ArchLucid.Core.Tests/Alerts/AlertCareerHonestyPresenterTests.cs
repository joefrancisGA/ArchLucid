using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Alerts;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Alerts;

/// <summary>CG-036 — alert title/body rehearsal honesty from run stamp.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AlertCareerHonestyPresenterTests
{
    [Fact]
    public void Career_real_run_omits_rehearsal_honesty()
    {
        RunSummaryDto run = RehearsalRun(
            StructuralExecutionMode.Real,
            WorkingCareerRehearsalDoorValues.Career);

        AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(run).Should().BeFalse();
    }

    [Fact]
    public void Career_simulator_run_prefixes_title_and_disclaimer()
    {
        RunSummaryDto run = RehearsalRun(
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Career);
        AlertRecord alert = SampleAlert("Cost spike", "Monthly spend exceeded threshold.");

        AlertCareerHonestyPresenter.ApplyToAlert(alert, run);

        alert.Title.Should().Be($"{AlertCareerHonestyPresenter.RehearsalTitlePrefix}Cost spike");
        alert.Description.Should().StartWith(AlertCareerHonestyPresenter.RehearsalBodyDisclaimer);
    }

    [Fact]
    public void Rehearsal_simulator_run_applies_honesty()
    {
        RunSummaryDto run = RehearsalRun(
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Rehearsal);

        AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(run).Should().BeTrue();
    }

    [Fact]
    public void Rehearsal_real_practice_run_applies_honesty()
    {
        RunSummaryDto run = RehearsalRun(
            StructuralExecutionMode.Real,
            WorkingCareerRehearsalDoorValues.Rehearsal);

        AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(run).Should().BeTrue();
    }

    [Fact]
    public void Sample_run_skips_honesty()
    {
        RunSummaryDto run = RehearsalRun(
            StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoorValues.Career,
            isSample: true);

        AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(run).Should().BeFalse();
    }

    [Fact]
    public void Apply_is_idempotent_when_title_and_body_already_stamped()
    {
        RunSummaryDto run = RehearsalRun(
            StructuralExecutionMode.Fallback,
            WorkingCareerRehearsalDoorValues.Rehearsal);
        AlertRecord alert = SampleAlert(
            $"{AlertCareerHonestyPresenter.RehearsalTitlePrefix}Existing",
            $"{AlertCareerHonestyPresenter.RehearsalBodyDisclaimer}\n\nBody");

        AlertCareerHonestyPresenter.ApplyToAlert(alert, run);

        alert.Title.Should().Be($"{AlertCareerHonestyPresenter.RehearsalTitlePrefix}Existing");
        alert.Description.Should().Be($"{AlertCareerHonestyPresenter.RehearsalBodyDisclaimer}\n\nBody");
    }

    private static RunSummaryDto RehearsalRun(
        StructuralExecutionMode mode,
        string door,
        bool isSample = false) =>
        new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = "demo",
            StructuralExecutionMode = mode,
            WorkingCareerRehearsalDoor = door,
            IsSample = isSample,
        };

    private static AlertRecord SampleAlert(string title, string description) =>
        new()
        {
            Title = title,
            Description = description,
            Severity = AlertSeverity.Warning,
            Status = AlertStatus.Open,
            Category = "test",
            TriggerValue = "1",
            DeduplicationKey = "dedup",
        };
}
