using ArchLucid.AgentRuntime;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using CoreLlm = ArchLucid.Core.Llm;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>
/// Optional live-model eval against the golden incomplete fixture.
/// Skipped unless ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY are set.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Speed", "Slow")]
public sealed class ArchitectureIntelligenceLiveGoldenEvalTests
{
    [SkippableFact]
    public async Task Live_golden_fixture_produces_non_empty_closed_loop_output()
    {
        Skip.IfNot(
            ArchitectureIntelligenceLiveLlmGate.TryGetLiveCredentials(out _),
            "Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY.");

        ArchitectureIntelligenceLiveLlmGate.LiveCredentials live =
            ArchitectureIntelligenceLiveLlmGate.TryGetLiveCredentials(
                out ArchitectureIntelligenceLiveLlmGate.LiveCredentials credentials)
                ? credentials
                : throw new InvalidOperationException("Live credentials required.");

        using CancellationTokenSource deadline = new(TimeSpan.FromSeconds(180));
        using AzureOpenAiCompletionClient completion = new(
            live.Endpoint,
            live.ApiKey,
            live.Deployment,
            AzureOpenAiCompletionClient.DefaultMaxCompletionTokens);

        ServiceCollection services = new();
        services.AddSingleton<CoreLlm.IAgentCompletionClient>(new LiveCoreLlmCompletionAdapter(completion));
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        await using ServiceProvider provider = services.BuildServiceProvider();

        IGoldenArchitectureTestRunner goldenRunner =
            provider.GetRequiredService<IGoldenArchitectureTestRunner>();

        ClosedLoopReasoningRequest request = GoldenIncompleteArchitectureFixture.CreateRequest("tenant-live-ai");
        request.ReviewTier = ArchitectureIntelligenceReviewTier.Standard;

        GoldenArchitectureTestResult golden = await goldenRunner.RunAsync(request, deadline.Token);

        golden.Should().NotBeNull();
        golden.MutationChangedFindings.Should().BeTrue();
        golden.CategoryScores.Should().NotBeEmpty();
        golden.AfterCounts.Should().NotBeEmpty();
    }
}
