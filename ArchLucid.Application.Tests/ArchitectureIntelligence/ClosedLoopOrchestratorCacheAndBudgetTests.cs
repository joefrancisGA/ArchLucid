using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopOrchestratorCacheAndBudgetTests
{
    [Fact]
    public async Task RunAsync_second_identical_request_is_cache_hit()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        await using ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-cache-hit",
            DeclaredPriorities = ["Security"],
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = "Public API exposes customer records without authentication.",
                },
            ],
        };

        ClosedLoopReasoningResult first = await orchestrator.RunAsync(request);
        first.CacheHit.Should().BeFalse();

        ClosedLoopReasoningResult second = await orchestrator.RunAsync(request);
        second.CacheHit.Should().BeTrue();
        second.CacheReuseReason.Should().NotBeNullOrWhiteSpace();
        second.Model.Elements.Should().BeEquivalentTo(first.Model.Elements, options =>
            options.Excluding(element => element.ElementId));
    }

    [Fact]
    public async Task RunAsync_cache_hit_rewrites_run_identity_from_current_request()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        await using ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = "tenant-cache-run-id",
            RunId = "run-cache-first",
            DeclaredPriorities = ["Security"],
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = "Public API exposes customer records without authentication.",
                },
            ],
        };

        ClosedLoopReasoningResult first = await orchestrator.RunAsync(request);
        first.CacheHit.Should().BeFalse();

        ClosedLoopReasoningResult second = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-cache-run-id",
            RunId = "run-cache-second",
            DeclaredPriorities = ["Security"],
            SourceTexts = request.SourceTexts,
        });

        second.CacheHit.Should().BeTrue();
        second.RunId.Should().Be("run-cache-second");
        second.Model.RunId.Should().Be("run-cache-second");
        second.ModelId.Should().Be(first.ModelId);
        second.Model.ModelId.Should().Be(first.Model.ModelId);
    }

    [Fact]
    public async Task RunAsync_rejects_when_trial_budget_exceeded()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        await using ServiceProvider provider = services.BuildServiceProvider();
        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-budget-reject",
            ReviewTier = ArchitectureIntelligenceReviewTier.Trial,
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "huge.md",
                    ContentType = "text/markdown",
                    Content = new string('y', 40_000),
                },
            ],
        });

        result.BudgetRejected.Should().BeTrue();
        result.BudgetRejectReason.Should().NotBeNullOrWhiteSpace();
        result.Model.Elements.Should().BeEmpty();
        result.SpecialistReviews.Should().BeEmpty();
    }
}
