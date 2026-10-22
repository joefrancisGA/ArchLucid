using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmCompletionUsageBillingNormalizationTests
{
    [Fact]
    public void NormalizeForCostEstimate_reasoning_only_splits_zero_completion()
    {
        LlmCompletionUsageBillingNormalization.BillableTokenCounts counts =
            LlmCompletionUsageBillingNormalization.NormalizeForCostEstimate(0, 0, 300);

        counts.Prompt.Should().Be(0);
        counts.Output.Should().Be(0);
        counts.Reasoning.Should().Be(300);
    }

    [Fact]
    public void NormalizeForCostEstimate_mixed_subtracts_reasoning_from_completion()
    {
        LlmCompletionUsageBillingNormalization.BillableTokenCounts counts =
            LlmCompletionUsageBillingNormalization.NormalizeForCostEstimate(10, 100, 30);

        counts.Prompt.Should().Be(10);
        counts.Output.Should().Be(70);
        counts.Reasoning.Should().Be(30);
    }

    [Fact]
    public void NormalizeForCostEstimate_completion_without_reasoning_breakdown_unchanged()
    {
        LlmCompletionUsageBillingNormalization.BillableTokenCounts counts =
            LlmCompletionUsageBillingNormalization.NormalizeForCostEstimate(5, 50, 0);

        counts.Output.Should().Be(50);
        counts.Reasoning.Should().Be(0);
    }

    [Fact]
    public void NormalizeForCostEstimate_all_reasoning_completion_bills_reasoning_only()
    {
        LlmCompletionUsageBillingNormalization.BillableTokenCounts counts =
            LlmCompletionUsageBillingNormalization.NormalizeForCostEstimate(0, 100, 100);

        counts.Output.Should().Be(0);
        counts.Reasoning.Should().Be(100);
    }

    [Fact]
    public void HasMeasurableUsage_false_for_zero_usage()
    {
        LlmCompletionUsageBillingNormalization.BillableTokenCounts counts =
            LlmCompletionUsageBillingNormalization.NormalizeForCostEstimate(0, 0, 0);

        LlmCompletionUsageBillingNormalization.HasMeasurableUsage(counts).Should().BeFalse();
    }

    [Fact]
    public void DailyOutputTokenPressure_uses_completion_when_present_else_reasoning()
    {
        LlmCompletionUsageBillingNormalization.DailyOutputTokenPressure(100, 30).Should().Be(100);
        LlmCompletionUsageBillingNormalization.DailyOutputTokenPressure(0, 300).Should().Be(300);
    }
}
