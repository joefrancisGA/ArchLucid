using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopLiveResultPublishMetadataTests
{
    [Fact]
    public async Task RunAsync_preserves_publish_metadata_on_returned_result_after_product_publish()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        services.AddClosedLoopArchitectureIntelligenceTestDependencies();
        services.RemoveAll<ITrustPublishGate>();
        services.AddSingleton<ITrustPublishGate, NeverBlockedTrustPublishGate>();
        services.RemoveAll<IArchitectureIntelligenceProductPublishService>();
        services.AddSingleton<IArchitectureIntelligenceProductPublishService>(new StubProductPublishService());
        await using ServiceProvider provider = services.BuildServiceProvider();

        IClosedLoopArchitectureReasoningOrchestrator orchestrator =
            provider.GetRequiredService<IClosedLoopArchitectureReasoningOrchestrator>();

        ClosedLoopReasoningResult result = await orchestrator.RunAsync(new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-live-publish",
            RunId = Guid.NewGuid().ToString("N"),
            PublishToProduct = true,
            DeclaredPriorities = ["Security"],
            FramingAnswers = CreateCompleteFramingAnswers(),
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "architecture.md",
                    ContentType = "text/markdown",
                    Content = """
                        Public API exposes customer records without authentication.
                        Billing worker is an unowned component.
                        """,
                },
            ],
        });

        result.PublishedToProduct.Should().BeTrue();
        result.PublishedFindingsSnapshotId.Should().NotBeNull();
        result.PublishedRecommendationCount.Should().Be(1);
        result.PublishSkipReason.Should().BeNull();
    }

    private static Dictionary<string, string> CreateCompleteFramingAnswers()
    {
        return new Dictionary<string, string>
        {
            ["business-outcome"] = "Secure customer onboarding",
            ["system-boundary"] = "Public API and billing worker",
            ["fixed-decisions"] = "Azure is the cloud provider",
            ["critical-quality-attributes"] = "Security and reliability",
            ["unacceptable-failures"] = "Data breach",
            ["architecture-kind"] = "Greenfield integration",
        };
    }

    private sealed class StubProductPublishService : IArchitectureIntelligenceProductPublishService
    {
        public Task<ArchitectureIntelligencePublishResult> PublishAsync(
            ClosedLoopReasoningResult result,
            string tenantId,
            string workspaceId,
            string projectId,
            string runId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new ArchitectureIntelligencePublishResult
            {
                Published = true,
                FindingsSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                RecommendationCount = 1,
            });
        }
    }
}
