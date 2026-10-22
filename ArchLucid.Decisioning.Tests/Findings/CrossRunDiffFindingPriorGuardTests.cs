using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CrossRunDiffFindingPriorGuardTests
{
    [Fact]
    public void ShouldInvoke_rejects_blank_engine_type()
    {
        Action act = () => CrossRunDiffFindingPriorGuard.ShouldInvoke(" ", analysisContext: null);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ShouldInvoke_allows_baseline_engines_when_prior_is_absent()
    {
        bool invoke = CrossRunDiffFindingPriorGuard.ShouldInvoke("requirement", analysisContext: null);

        invoke.Should().BeTrue();
    }

    [Theory]
    [InlineData("requirement-cross-run-diff")]
    [InlineData("topology-cross-run-diff")]
    [InlineData("Requirement-Cross-Run-Diff")]
    public void ShouldInvoke_skips_cross_run_engines_when_prior_is_absent(string engineType)
    {
        bool invoke = CrossRunDiffFindingPriorGuard.ShouldInvoke(engineType, analysisContext: null);

        invoke.Should().BeFalse();
    }

    [Fact]
    public void ShouldInvoke_skips_cross_run_engines_when_prior_run_id_is_unset()
    {
        FindingAnalysisContext analysisContext = new()
        {
            Prior = new PriorReviewSnapshots(),
        };

        bool invoke = CrossRunDiffFindingPriorGuard.ShouldInvoke(
            "requirement-cross-run-diff",
            analysisContext);

        invoke.Should().BeFalse();
    }

    [Fact]
    public void ShouldInvoke_skips_cross_run_engines_when_prior_run_id_is_empty()
    {
        FindingAnalysisContext analysisContext = new()
        {
            Prior = new PriorReviewSnapshots { PriorRunId = Guid.Empty },
        };

        bool invoke = CrossRunDiffFindingPriorGuard.ShouldInvoke(
            "requirement-cross-run-diff",
            analysisContext);

        invoke.Should().BeFalse();
    }

    [Fact]
    public void ShouldInvoke_runs_cross_run_engines_when_prior_run_is_bound()
    {
        FindingAnalysisContext analysisContext = new()
        {
            Prior = new PriorReviewSnapshots { PriorRunId = Guid.NewGuid() },
        };

        bool invoke = CrossRunDiffFindingPriorGuard.ShouldInvoke(
            "topology-cross-run-diff",
            analysisContext);

        invoke.Should().BeTrue();
    }

    [Fact]
    public void IsCrossRunDiffEngine_matches_requirement_and_topology_ids_only()
    {
        CrossRunDiffFindingPriorGuard.IsCrossRunDiffEngine("requirement-cross-run-diff").Should().BeTrue();
        CrossRunDiffFindingPriorGuard.IsCrossRunDiffEngine("topology-cross-run-diff").Should().BeTrue();
        CrossRunDiffFindingPriorGuard.IsCrossRunDiffEngine("requirement").Should().BeFalse();
        CrossRunDiffFindingPriorGuard.IsCrossRunDiffEngine(null).Should().BeFalse();
    }
}
