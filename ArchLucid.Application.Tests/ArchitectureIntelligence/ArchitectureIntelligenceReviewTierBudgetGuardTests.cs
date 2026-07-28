using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceReviewTierBudgetGuardTests
{
    [Fact]
    public void Evaluate_permits_short_standard_request()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = new();
        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-budget",
            ReviewTier = ArchitectureIntelligenceReviewTier.Standard,
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = "Public API without authentication.",
                },
            ],
        };

        ArchitectureIntelligenceBudgetDecision decision = guard.Evaluate(request);

        decision.Permitted.Should().BeTrue();
        decision.EstimatedTokens.Should().BeLessThanOrEqualTo(decision.MaxTokens);
    }

    [Fact]
    public void Evaluate_rejects_oversized_trial_request()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = new();
        string huge = new('x', 40_000);
        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-budget",
            ReviewTier = ArchitectureIntelligenceReviewTier.Trial,
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "huge.md",
                    ContentType = "text/markdown",
                    Content = huge,
                },
            ],
        };

        ArchitectureIntelligenceBudgetDecision decision = guard.Evaluate(request);

        decision.Permitted.Should().BeFalse();
        decision.RejectReason.Should().Contain("Trial");
    }
}
