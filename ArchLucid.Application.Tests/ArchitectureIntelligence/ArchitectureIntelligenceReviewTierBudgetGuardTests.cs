using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceReviewTierBudgetGuardTests
{
    private const string TenantId = "5f2b1c9e-9f38-4a1c-9c1a-2f9c5d7e4b11";

    [Fact]
    public async Task EvaluateAsync_permits_short_standard_request_without_budget_services()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = new();

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(CreateRequest());

        decision.Permitted.Should().BeTrue();
        decision.EstimatedTokens.Should().BeLessThanOrEqualTo(decision.MaxTokens);
        decision.BudgetEnforced.Should().BeFalse();
    }

    [Fact]
    public async Task EvaluateAsync_rejects_sources_larger_than_selected_depth()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = new();
        ClosedLoopReasoningRequest request = CreateRequest(
            tier: ArchitectureIntelligenceReviewTier.Trial,
            content: new string('x', 40_000));

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(request);

        decision.Permitted.Should().BeFalse();
        decision.RejectReason.Should().Contain("Trial");
        decision.RejectReason.Should().Contain("trim the sources");
    }

    [Fact]
    public async Task EvaluateAsync_rejects_when_workspace_budget_already_exhausted()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = CreateGuard(
            CreatePolicy(remainingUsd: 0m, hardStop: true, blocks: true),
            estimatedCostUsd: 0.10m);

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(CreateRequest());

        decision.Permitted.Should().BeFalse();
        decision.RejectReason.Should().Contain("exhausted");
    }

    [Fact]
    public async Task EvaluateAsync_rejects_when_estimate_exceeds_remaining_budget()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = CreateGuard(
            CreatePolicy(remainingUsd: 0.25m, hardStop: true, blocks: false),
            estimatedCostUsd: 1.50m);

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(CreateRequest());

        decision.Permitted.Should().BeFalse();
        decision.RejectReason.Should().Contain("$1.50");
        decision.RejectReason.Should().Contain("$0.25");
        decision.BudgetEnforced.Should().BeTrue();
    }

    [Fact]
    public async Task EvaluateAsync_permits_and_reports_cost_when_estimate_fits_remaining_budget()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = CreateGuard(
            CreatePolicy(remainingUsd: 12.00m, hardStop: true, blocks: false),
            estimatedCostUsd: 0.42m);

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(CreateRequest());

        decision.Permitted.Should().BeTrue();
        decision.BudgetEnforced.Should().BeTrue();
        decision.EstimatedCostUsd.Should().Be(0.42m);
        decision.RemainingBudgetUsd.Should().Be(12.00m);
    }

    [Fact]
    public async Task EvaluateAsync_permits_over_budget_estimate_when_hard_stop_disabled()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = CreateGuard(
            CreatePolicy(remainingUsd: 0.10m, hardStop: false, blocks: false),
            estimatedCostUsd: 5.00m);

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(CreateRequest());

        decision.Permitted.Should().BeTrue();
        decision.EstimatedCostUsd.Should().Be(5.00m);
    }

    [Fact]
    public async Task EvaluateAsync_does_not_enforce_usd_when_cost_estimation_disabled()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = CreateGuard(
            CreatePolicy(remainingUsd: 0.01m, hardStop: true, blocks: false),
            estimatedCostUsd: null);

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(CreateRequest());

        decision.Permitted.Should().BeTrue();
        decision.BudgetEnforced.Should().BeFalse();
        decision.RemainingBudgetUsd.Should().Be(0.01m);
    }

    [Fact]
    public async Task EvaluateAsync_skips_budget_lookup_when_tenant_missing()
    {
        Mock<ITenantAiBudgetPolicyResolver> resolver = new(MockBehavior.Strict);
        ArchitectureIntelligenceReviewTierBudgetGuard guard = new(resolver.Object, CreateEstimator(0.10m));
        ClosedLoopReasoningRequest request = CreateRequest();
        request.TenantId = null;

        ArchitectureIntelligenceBudgetDecision decision = await guard.EvaluateAsync(request);

        decision.Permitted.Should().BeTrue();
        decision.BudgetEnforced.Should().BeFalse();
        resolver.Verify(
            r => r.ResolveAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EvaluateAsync_throws_when_request_is_null()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard guard = new();

        Func<Task> act = async () => await guard.EvaluateAsync(null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void DepthTokenAllowance_grows_with_depth()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard
            .DepthTokenAllowance(ArchitectureIntelligenceReviewTier.Trial)
            .Should()
            .BeLessThan(ArchitectureIntelligenceReviewTierBudgetGuard
                .DepthTokenAllowance(ArchitectureIntelligenceReviewTier.Deep));
    }

    [Fact]
    public void AssumedCompletionTokens_grows_with_depth()
    {
        ArchitectureIntelligenceReviewTierBudgetGuard
            .AssumedCompletionTokens(ArchitectureIntelligenceReviewTier.Trial)
            .Should()
            .BeLessThan(ArchitectureIntelligenceReviewTierBudgetGuard
                .AssumedCompletionTokens(ArchitectureIntelligenceReviewTier.Deep));
    }

    private static ArchitectureIntelligenceReviewTierBudgetGuard CreateGuard(
        TenantAiBudgetPolicySnapshot policy,
        decimal? estimatedCostUsd)
    {
        Mock<ITenantAiBudgetPolicyResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        return new ArchitectureIntelligenceReviewTierBudgetGuard(resolver.Object, CreateEstimator(estimatedCostUsd));
    }

    private static ILlmCostEstimator CreateEstimator(decimal? estimatedCostUsd)
    {
        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(e => e.EstimateUsd(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Returns(estimatedCostUsd);

        return estimator.Object;
    }

    private static TenantAiBudgetPolicySnapshot CreatePolicy(decimal remainingUsd, bool hardStop, bool blocks) =>
        new()
        {
            BudgetAmountUsd = 50m,
            RemainingAmountUsd = remainingUsd,
            HardStopEnabled = hardStop,
            BlocksAdditionalLlmExecution = blocks,
        };

    private static ClosedLoopReasoningRequest CreateRequest(
        ArchitectureIntelligenceReviewTier tier = ArchitectureIntelligenceReviewTier.Standard,
        string content = "Public API without authentication.") =>
        new()
        {
            TenantId = TenantId,
            ReviewTier = tier,
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = content,
                },
            ],
        };
}
