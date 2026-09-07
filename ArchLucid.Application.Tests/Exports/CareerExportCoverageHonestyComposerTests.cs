using ArchLucid.Application.Exports;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CareerExportCoverageHonestyComposerTests
{
    [Fact]
    public void Resolve_blocks_working_career_export_when_measurement_count_is_unknown()
    {
        CareerExportCoverageHonestyInput input = CreateInput(enginesSucceeded: null, workingDesk: true);
        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeTrue();
        honesty.MeasurementFloorBlockedReason.Should().Contain("not been measured");
    }

    [Fact]
    public void Resolve_blocks_working_career_export_when_measurement_floor_is_unmet()
    {
        CareerExportCoverageHonestyInput input = CreateInput(enginesSucceeded: 8, workingDesk: true);
        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeTrue();
        honesty.MeasurementFloorBlockedReason.Should().Contain("measurement floor");
    }

    [Fact]
    public void Resolve_blocks_working_career_export_when_catalog_advisory_engine_failed()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 16,
            workingDesk: true,
            catalogAdvisoryEngineFailureCount: 1);

        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeTrue();
        honesty.MeasurementFloorBlockedReason.Should().Contain("catalog engine failed");
    }

    [Fact]
    public void Resolve_blocks_working_career_export_when_pre_commit_gate_is_disabled()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 16,
            workingDesk: true,
            preCommitGateEnabled: false);

        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeTrue();
        honesty.MeasurementFloorBlockedReason.Should().Contain("not a fully governed review record");
    }

    [Fact]
    public void Resolve_blocks_working_career_export_when_quality_gate_is_warn_only_on_real_mode()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 16,
            workingDesk: true,
            structuralExecutionMode: StructuralExecutionMode.Real,
            hostAgentExecutionMode: "Real",
            hostQualityGateMode: AgentOutputQualityGateMode.WarnOnly);

        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeTrue();
        honesty.MeasurementFloorBlockedReason.Should().Contain("Quality gate is WarnOnly");
    }

    [Fact]
    public void Resolve_allows_pilot_strict_real_mode_when_gate_passes()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: InsightDensityMeasurementFloorPresenter.CareerExportMeasurementFloorMinEngines,
            workingDesk: true,
            structuralExecutionMode: StructuralExecutionMode.Real,
            hostAgentExecutionMode: "Real",
            hostQualityGateMode: AgentOutputQualityGateMode.PilotStrict,
            aggregateQualityGateOutcome: AgentOutputQualityGateOutcome.Accepted);

        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeFalse();
    }

    [Fact]
    public void Resolve_blocks_working_career_export_when_quality_gate_disposition_is_warned()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 16,
            workingDesk: true,
            structuralExecutionMode: StructuralExecutionMode.Real,
            hostAgentExecutionMode: "Real",
            hostQualityGateMode: AgentOutputQualityGateMode.PilotStrict,
            aggregateQualityGateOutcome: AgentOutputQualityGateOutcome.Warned);

        CareerExportCoverageHonestyComposer.ResolveBlockedReason(input)
            .Should()
            .Contain("Warned");
    }

    [Fact]
    public void Resolve_allows_guided_exports_without_working_floor_enforcement()
    {
        CareerExportCoverageHonestyInput input = CreateInput(enginesSucceeded: 4, workingDesk: false);
        CareerExportCoverageHonesty honesty = CareerExportCoverageHonestyComposer.Resolve(input);

        honesty.BlockedForWorkingCareerExport.Should().BeFalse();
    }

    [Fact]
    public void FormatMarkdown_includes_skipped_actor_engines_for_iac_only_graphs()
    {
        CareerExportCoverageHonestyInput input = CreateInput(
            enginesSucceeded: 12,
            workingDesk: true,
            actorNodeCount: 0);

        string markdown = CareerExportCoverageHonestyComposer.FormatMarkdown(input);

        markdown.Should().Contain("external-exposure");
        markdown.Should().Contain("no Actor nodes");
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
        int? enginesSucceeded,
        bool workingDesk,
        CareerExportClassificationCounts? classificationCounts = null,
        int catalogAdvisoryEngineFailureCount = 0,
        bool preCommitGateEnabled = true,
        StructuralExecutionMode structuralExecutionMode = StructuralExecutionMode.Simulator,
        bool isSampleRun = false,
        string? hostAgentExecutionMode = null,
        AgentOutputQualityGateMode hostQualityGateMode = AgentOutputQualityGateMode.WarnOnly,
        AgentOutputQualityGateOutcome? aggregateQualityGateOutcome = null,
        int actorNodeCount = 1,
        int? judgeSkippedByCap = null)
    {
        SponsorReviewCoverageHonestyContext coverageContext = new(
            RunId: "run-1",
            Verdict: null,
            AnalysisStagesComplete: true,
            ActorNodeCount: actorNodeCount);

        return new CareerExportCoverageHonestyInput(
            coverageContext,
            enginesSucceeded,
            workingDesk,
            classificationCounts,
            catalogAdvisoryEngineFailureCount,
            preCommitGateEnabled,
            structuralExecutionMode,
            isSampleRun,
            hostAgentExecutionMode,
            hostQualityGateMode,
            null,
            aggregateQualityGateOutcome,
            judgeSkippedByCap);
    }
}
