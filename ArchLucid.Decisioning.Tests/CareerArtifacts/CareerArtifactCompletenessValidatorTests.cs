using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.CareerArtifacts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CareerArtifactCompletenessValidatorTests
{
    private readonly CareerArtifactCompletenessValidator _sut = new();
    private readonly int _meetsFloorEngineCount = InsightDensityMeasurementFloorPresenter.CareerExportMeasurementFloorMinEngines;

    [Fact]
    public void Evaluate_finalize_blocks_when_trail_is_null()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: null,
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().ContainSingle(reason =>
            reason.Code == CareerArtifactCompletenessValidator.TrailMissingCode);
    }

    [Fact]
    public void Evaluate_finalize_allows_empty_trail_sections()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            StructuralExecutionMode: StructuralExecutionMode.Real);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_export_blocks_when_trail_is_null()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: null,
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.TrailMissingCode);
    }

    [Fact]
    public void Evaluate_export_warns_on_legacy_sealed_reexport_without_trail()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: null,
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            LegacySealedReExport: true,
            StructuralExecutionMode: StructuralExecutionMode.Real);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeTrue();
        result.Warnings.Should().Contain(CareerArtifactCompletenessValidator.LegacySealedTrailWarning);
    }

    [Fact]
    public void Evaluate_blocks_when_measurement_count_is_null()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: null,
            WorkingDesk: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.MeasurementFloorCode
            && reason.Message.Contains("not been measured", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Evaluate_blocks_finalize_when_skipped_must_present()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    QuestionKey = "Q-001",
                    Tier = ElicitationQuestionTier.Must,
                },
            ],
        };

        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: trail,
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.SkippedMustCode);
    }

    [Fact]
    public void Evaluate_blocks_export_when_decision_grade_provenance_is_missing()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "finding-1",
                    FindingType = "PolicyViolation",
                    Classification = FindingClassification.DecisionGradeFinding,
                },
            ],
        };

        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            FindingsSnapshot: snapshot);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.DecisionGradeProvenanceCode);
    }

    [Fact]
    public void Evaluate_blocks_external_export_for_sample_runs_when_configured()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            IsSampleRun: true,
            BlockExternalSponsorDistribution: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.DemoSampleCode);
    }

    [Fact]
    public void Evaluate_blocks_real_mode_warn_only_export()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            StructuralExecutionMode: StructuralExecutionMode.Real,
            HostAgentExecutionMode: "Real",
            HostQualityGateMode: AgentOutputQualityGateMode.WarnOnly);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.QualityGateCode);
    }

    [Fact]
    public void Evaluate_export_blocks_when_asserted_trail_empty()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.AssertedEmptyCode);
    }

    [Fact]
    public void Evaluate_blocks_working_sample_export_without_external_distribution_flag()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            IsSampleRun: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.SampleWorkspaceExportCode);
    }

    [Fact]
    public void Evaluate_blocks_finalize_when_degraded_finding_coverage_on_working_desk()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            DegradedFindingCoverage: true,
            DegradedFindingCoverageFailedEngineLabels: ["PolicyEngine/Security"]);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.DegradedFindingCoverageCode
            && reason.Message.Contains("PolicyEngine/Security", StringComparison.Ordinal));
    }

    [Fact]
    public void Evaluate_allows_finalize_when_degraded_finding_coverage_on_guided_desk()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: false,
            DegradedFindingCoverage: true,
            DegradedFindingCoverageFailedEngineLabels: ["PolicyEngine/Security"]);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_blocks_working_simulator_export_without_rehearsal_banner_on_artifact()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            SimulatorRehearsalBannerOnArtifact: false);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.SimulatorRehearsalCode);
    }

    [Fact]
    public void Evaluate_allows_working_simulator_export_when_rehearsal_banner_is_on_artifact()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            SimulatorRehearsalBannerOnArtifact: true);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.BlockReasons.Should().NotContain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.SimulatorRehearsalCode);
    }

    [Fact]
    public void Evaluate_finalize_warns_when_asserted_trail_empty()
    {
        CareerArtifactCompletenessInput input = new(
            ArtifactKind: CareerArtifactKind.Finalize,
            TransparencyTrail: new TransparencyTrail(),
            EnginesSucceeded: _meetsFloorEngineCount,
            WorkingDesk: true,
            StructuralExecutionMode: StructuralExecutionMode.Real);

        CareerArtifactCompletenessResult result = _sut.Evaluate(input);

        result.CanRender.Should().BeTrue();
        result.Warnings.Should().Contain(CareerArtifactCompletenessValidator.AssertedTrailEmptyCareerClaimMessage);
    }
}
