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
            WorkingDesk: true);

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
            LegacySealedReExport: true);

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
}
