using ArtifactAdmission = ArchLucid.Application.Analysis.IntermediateMaterializationPolicy.Admission;

using static ArchLucid.Application.Analysis.IntermediateMaterializationPolicy;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class IntermediateMaterializationPolicyTests
{
    private static ArtifactAdmission SmallOptionalArtifact => new(true, 512, 1024, 2048,
        TimeSpan.FromHours(1), TimeSpan.FromHours(2));

    [Theory]
    [InlineData(0, Disposition.Recompute, -9)]
    [InlineData(1, Disposition.Recompute, -6)]
    [InlineData(3, Disposition.Recompute, 0)]
    [InlineData(4, Disposition.Candidate, 3)]
    public void Reuse_must_pay_for_reads_write_and_retention(int hits, Disposition outcome, int savings)
    {
        Decision result = Evaluate(SmallOptionalArtifact, new(5, 2, 7, 2, hits));

        Assert.Equal(outcome, result.Outcome);
        Assert.Equal((decimal)savings, result.ExpectedNetSavings);
    }

    [Fact]
    public void Protected_and_oversized_artifacts_cannot_be_cost_optimized()
    {
        Costs favorable = new(100, 1, 1, 1, 10);
        ArtifactAdmission optional = SmallOptionalArtifact;

        Assert.Equal(Disposition.ProtectedOutput,
            Evaluate(optional with { OptionalAndRecomputable = false }, favorable).Outcome);
        Assert.Equal(Disposition.OutsideBudget,
            Evaluate(optional with { Bytes = 1025 }, favorable).Outcome);
        Assert.Equal(Disposition.OutsideBudget,
            Evaluate(optional with { AvailableBytes = 511 }, favorable).Outcome);
        Assert.Equal(Disposition.OutsideBudget,
            Evaluate(optional with { Lifetime = TimeSpan.FromHours(3) }, favorable).Outcome);
    }

    [Fact]
    public void Unknown_or_overflowing_costs_do_not_authorize_retention()
    {
        Costs known = new(100, 1, 1, 1, 10);

        Assert.Equal(Disposition.Uncalibrated, Evaluate(SmallOptionalArtifact, known with { Retention = null }).Outcome);
        Assert.Equal(Disposition.Uncalibrated, Evaluate(SmallOptionalArtifact, known with { ExpectedHits = null }).Outcome);
        Assert.Equal(Disposition.Uncalibrated, Evaluate(SmallOptionalArtifact, known with { Read = -1 }).Outcome);
        Assert.Equal(Disposition.Uncalibrated,
            Evaluate(SmallOptionalArtifact, known with { Recompute = decimal.MaxValue }).Outcome);
        Assert.Equal(Disposition.Recompute, Evaluate(SmallOptionalArtifact, known with { Read = 120 }).Outcome);
        Assert.Equal(Disposition.Recompute, Evaluate(SmallOptionalArtifact, known, minimumSavings: 1000).Outcome);
    }
}
