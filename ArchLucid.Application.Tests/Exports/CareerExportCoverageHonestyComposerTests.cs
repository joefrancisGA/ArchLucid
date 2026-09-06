using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CareerExportCoverageHonestyComposerTests
{
    [Fact]
    public void Resolve_blocks_working_career_export_when_measurement_floor_is_unmet()
    {
        CareerExportCoverageHonestyInput input = CreateInput(enginesSucceeded: 8, workingDesk: true);
        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeTrue();
        honesty.MeasurementFloorBlockedReason.Should().Contain("measurement floor");
    }

    [Fact]
    public void Resolve_allows_guided_exports_without_working_floor_enforcement()
    {
        CareerExportCoverageHonestyInput input = CreateInput(enginesSucceeded: 4, workingDesk: false);
        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeFalse();
    }

    [Fact]
    public void FormatMarkdown_includes_measurement_floor_and_classification_bands()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 16,
            workingDesk: true,
            classificationCounts: new CareerExportClassificationCounts(4, 2));

        string markdown = CareerExportCoverageHonestyComposer.FormatMarkdown(input);

        markdown.Should().Contain("Measurement floor");
        markdown.Should().Contain("Decision-grade: 4");
        markdown.Should().Contain("Checklist: 2");
    }

    [Fact]
    public void ResolveBlockedReason_returns_floor_gate_copy_for_manifest_exports()
    {
        CareerExportCoverageHonestyInput input = CreateInput(enginesSucceeded: 5, workingDesk: true);

        CareerExportCoverageHonestyComposer.ResolveBlockedReason(input)
            .Should()
            .Contain("measurement floor");
    }

    [Fact]
    public void FormatPlainText_strips_markdown_headings()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 16,
            workingDesk: true,
            classificationCounts: new CareerExportClassificationCounts(1, 0));

        string plain = CareerExportCoverageHonestyComposer.FormatPlainText(input);

        plain.Should().NotContain("##");
        plain.Should().Contain("Measurement floor");
    }

    [Fact]
    public void CountClassificationBands_splits_decision_grade_and_checklist_rows()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding { Classification = FindingClassification.DecisionGradeFinding },
                new Finding { Classification = FindingClassification.ChecklistCoverage },
            ],
        };

        CareerExportClassificationCounts? counts = CareerExportCoverageHonestyMaterialLoader.CountClassificationBands(snapshot);

        counts.Should().NotBeNull();
        counts!.DecisionGrade.Should().Be(1);
        counts.Checklist.Should().Be(1);
    }

    private static CareerExportCoverageHonestyInput CreateInput(
        int enginesSucceeded,
        bool workingDesk,
        CareerExportClassificationCounts? classificationCounts = null)
    {
        SponsorReviewCoverageHonestyContext coverageContext = new(
            RunId: "run-1",
            Verdict: null,
            AnalysisStagesComplete: true,
            ActorNodeCount: 1);

        return new CareerExportCoverageHonestyInput(
            coverageContext,
            enginesSucceeded,
            workingDesk,
            classificationCounts);
    }
}
