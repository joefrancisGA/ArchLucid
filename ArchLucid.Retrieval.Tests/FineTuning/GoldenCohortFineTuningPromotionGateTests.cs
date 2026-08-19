using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.FineTuning;

[Trait("Category", "Unit")]
public sealed class GoldenCohortFineTuningPromotionGateTests
{
    [Fact]
    public void Evaluate_promotes_when_fine_tuned_meets_floor_and_base()
    {
        GoldenCohortFineTuningPromotionGate gate =
            new(FineTuningTestFixtures.CreateOptions(minRatio: 0.80));

        FineTuningEvalGateResult result = gate.Evaluate(baseSupportRatio: 0.75, fineTunedSupportRatio: 0.85);

        result.Promoted.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_rejects_regression_against_base()
    {
        GoldenCohortFineTuningPromotionGate gate =
            new(FineTuningTestFixtures.CreateOptions(minRatio: 0.70));

        FineTuningEvalGateResult result = gate.Evaluate(baseSupportRatio: 0.90, fineTunedSupportRatio: 0.85);

        result.Promoted.Should().BeFalse();
        result.Reason.Should().Contain("regressed");
    }
}
