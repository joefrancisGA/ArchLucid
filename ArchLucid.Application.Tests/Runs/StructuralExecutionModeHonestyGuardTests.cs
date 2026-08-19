using ArchLucid.Application.Findings;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuralExecutionModeHonestyGuardTests
{
    public static TheoryData<StructuralExecutionMode> NonRealModes =>
        new()
        {
            StructuralExecutionMode.Simulator,
            StructuralExecutionMode.Fallback,
            StructuralExecutionMode.Mixed,
        };

    [Theory]
    [MemberData(nameof(NonRealModes))]
    public void DisplayLabel_never_promotes_non_real_modes_to_Real(StructuralExecutionMode mode)
    {
        string label = StructuralExecutionModeLabels.ToDisplayLabel(mode);

        StructuralExecutionModeHonesty.DisplayLabelMatchesPersistedMode(mode, label).Should().BeTrue();
        StructuralExecutionModeHonesty.IsBuyerRealEvidenceMode(mode).Should().BeFalse();
        label.Should().NotBe("Real");
    }

    [Fact]
    public void Roi_period_mix_footnote_is_distinct_from_within_run_mixed_detail()
    {
        StructuralExecutionModeHonesty.RoiPeriodMixedModeFootnote.Should().Contain("reporting period");
        StructuralExecutionModeLabels.MixedDetail.Should().Contain("per-agent traces");
        StructuralExecutionModeHonesty.RoiPeriodMixedModeFootnote.Should()
            .NotBe(StructuralExecutionModeLabels.MixedDetail);
    }

    [Fact]
    public void Executive_roi_period_IsMixedMode_is_independent_of_within_run_Mixed_enum()
    {
        SponsorRoiHistoryRunModeCalculator.IsMixedMode(realRunCount: 2, simulatorRunCount: 1).Should().BeTrue();
        StructuralExecutionModeHonesty.IsBuyerRealEvidenceMode(StructuralExecutionMode.Mixed).Should().BeFalse();
    }

    [Theory]
    [MemberData(nameof(NonRealModes))]
    public void Sponsor_execution_mode_formatter_never_labels_non_real_as_Real(StructuralExecutionMode mode)
    {
        ArchitectureRun run = new()
        {
            RunId = "run-1",
            RequestId = "req-1",
            StructuralExecutionMode = mode,
        };

        string formatted = SponsorExecutionModeMarkdownFormatter.FormatSponsorExecutionMode(run);

        formatted.Should().StartWith($"**{StructuralExecutionModeLabels.ToDisplayLabel(mode)}**");
        formatted.Should().NotContain("**Real** — Live model path");
    }

    [Fact]
    public void Finding_inspect_null_run_mode_does_not_default_to_real_model_context()
    {
        FindingInspectResponse response = new();

        AgentTrustContext context = FindingInspectTrustContextResolver.Resolve(response);

        context.IsRealModel.Should().BeFalse();
    }

    [Fact]
    public void Finding_inspect_mixed_run_marks_non_real_trust_context()
    {
        FindingInspectResponse response = new()
        {
            RunStructuralExecutionMode = StructuralExecutionMode.Mixed,
        };

        AgentTrustContext context = FindingInspectTrustContextResolver.Resolve(response);

        context.IsRealModel.Should().BeFalse();
        context.IsSimulatorDerived.Should().BeTrue();
        context.IsDegraded.Should().BeTrue();
    }
}
