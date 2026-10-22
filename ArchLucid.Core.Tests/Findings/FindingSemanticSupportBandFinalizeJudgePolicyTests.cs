using ArchLucid.Contracts.Common;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingSemanticSupportBandFinalizeJudgePolicyTests
{
    [Fact]
    public void ShouldRun_real_and_default_options_is_true()
    {
        FindingSemanticSupportBandFinalizeJudgePolicy
            .ShouldRun(StructuralExecutionMode.Real, new FindingSemanticSupportBandOptions())
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldRun_simulator_is_false_even_when_flag_true()
    {
        FindingSemanticSupportBandOptions options = new() { EnableLlmJudgeOnFinalize = true };

        FindingSemanticSupportBandFinalizeJudgePolicy
            .ShouldRun(StructuralExecutionMode.Simulator, options)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldRun_fallback_is_false_even_when_flag_true()
    {
        FindingSemanticSupportBandOptions options = new() { EnableLlmJudgeOnFinalize = true };

        FindingSemanticSupportBandFinalizeJudgePolicy
            .ShouldRun(StructuralExecutionMode.Fallback, options)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldRun_real_is_false_when_flag_opted_off()
    {
        FindingSemanticSupportBandOptions options = new() { EnableLlmJudgeOnFinalize = false };

        FindingSemanticSupportBandFinalizeJudgePolicy
            .ShouldRun(StructuralExecutionMode.Real, options)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldRun_throws_when_options_null()
    {
        Action act = static () =>
            FindingSemanticSupportBandFinalizeJudgePolicy.ShouldRun(StructuralExecutionMode.Real, null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
