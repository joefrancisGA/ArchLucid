using ArchLucid.Decisioning.Findings;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Decisioning.Tests.Findings;

public sealed class InsightDensityMeasurementFloorPresenterTests
{
    [Fact]
    public void Present_pins_catalog_and_harness_counts_to_decisioning_constants()
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 23);

        presentation.CatalogEngineCount.Should().Be(39);
        presentation.HarnessEngineCount.Should().Be(16);
        presentation.MeasuredThisRunEngineCount.Should().Be(23);
    }

    [Fact]
    public void Present_null_run_uses_honest_absence_copy_and_blocks_career_floor()
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: null);

        presentation.MeasuredThisRunEngineCount.Should().BeNull();
        presentation.Sentence.Should().Contain("no measured engine coverage");
        presentation.Sentence.Should().NotContain("all clear");
        presentation.MeetsCareerExportFloor.Should().BeFalse();
    }

    [Fact]
    public void Present_zero_findings_measures_zero_and_blocks_career_floor()
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 0);

        presentation.MeasuredThisRunEngineCount.Should().Be(0);
        presentation.MeetsCareerExportFloor.Should().BeFalse();
        presentation.Sentence.Should().Contain("0 of 39");
    }

    [Fact]
    public void Present_partial_coverage_names_thin_floor_without_claiming_full_catalog()
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 10);

        presentation.MeetsCareerExportFloor.Should().BeFalse();
        presentation.Sentence.Should().Contain("analytically incomplete");
        presentation.Sentence.Should().NotContain("all engines scored", "because partial coverage must stay honest");
    }

    [Fact]
    public void Present_harness_floor_meets_career_export_gate()
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 16);

        presentation.MeetsCareerExportFloor.Should().BeTrue();
        presentation.Sentence.Should().NotContain("analytically incomplete");
    }

    [Fact]
    public void FormatCareerExportBlockedReason_returns_null_when_floor_is_met()
    {
        InsightDensityMeasurementFloorPresenter.FormatCareerExportBlockedReason(16).Should().BeNull();
    }

    [Fact]
    public void FormatCareerExportBlockedReason_returns_not_measured_copy_when_count_is_null()
    {
        string? reason = InsightDensityMeasurementFloorPresenter.FormatCareerExportBlockedReason(null);

        reason.Should().Contain("not been measured");
        reason.Should().Contain("16");
    }

    [Fact]
    public void FormatCareerExportBlockedReason_returns_advisory_catalog_failure_copy()
    {
        string? reason = InsightDensityMeasurementFloorPresenter.FormatCareerExportBlockedReason(
            measuredEnginesSucceeded: 16,
            catalogAdvisoryEngineFailureCount: 2);

        reason.Should().Contain("2 catalog engines failed");
    }

    [Fact]
    public void FormatCareerExportBlockedReason_returns_gate_copy_when_floor_is_unmet()
    {
        string? reason = InsightDensityMeasurementFloorPresenter.FormatCareerExportBlockedReason(10);

        reason.Should().Contain("measurement floor");
    }
}
