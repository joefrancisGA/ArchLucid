using ArchLucid.AgentRuntime.Batch;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestChunkSummaryCompletionClientTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public async Task Caller_cancellation_takes_precedence_over_sync_result_or_failure(int outcome)
    {
        using CancellationTokenSource caller = new();
        Router router = new(new CompletionClient(token =>
        {
            caller.Cancel();
            return outcome switch
            {
                0 => Task.FromResult("provider ignored cancellation"),
                1 => Task.FromException<string>(new InvalidOperationException("provider fault")),
                _ => Task.FromCanceled<string>(token),
            };
        }));
        ManifestChunkSummaryCompletionClient sut = Build(router);

        OperationCanceledException error = await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => sut.SummarizeChunkAsync("manifest", caller.Token));

        Assert.Equal(caller.Token, error.CancellationToken);
        Assert.Equal(1, router.Calls);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Caller_cancellation_takes_precedence_over_batch_result_or_fallback(bool fail)
    {
        using CancellationTokenSource caller = new();
        Router router = new(new CompletionClient(_ => Task.FromResult("sync completion")));
        BatchClient batch = new(item =>
        {
            caller.Cancel();
            if (fail)
                throw new InvalidOperationException("batch failed");

            return new BatchChatCompletionResult { CustomId = item.CustomId, AssistantText = "batch summary" };
        });
        ManifestChunkSummaryCompletionClient sut = Build(router, batch);

        OperationCanceledException error = await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => sut.SummarizeChunkAsync("manifest", caller.Token));

        Assert.Equal(caller.Token, error.CancellationToken);
        Assert.Equal(0, router.Calls);
    }

    [Fact]
    public async Task Provider_only_failure_retains_truncated_source_fallback()
    {
        Router router = new(new CompletionClient(_ => Task.FromCanceled<string>(new CancellationToken(true))));
        ManifestChunkSummaryCompletionClient sut = Build(router);

        Assert.Equal(new string('x', 1500), await sut.SummarizeChunkAsync(new string('x', 1600), CancellationToken.None));
    }

    private static ManifestChunkSummaryCompletionClient Build(Router router, BatchClient? batch = null) =>
        new(router, batch ?? new BatchClient(_ => throw new InvalidOperationException("batch not enabled")),
            new BatchOptions(new LlmBatchOptions { Enabled = batch is not null, RouteManifestSummarization = true }),
            new BatchRouting(), NullLogger<ManifestChunkSummaryCompletionClient>.Instance);

    private sealed class BatchOptions(LlmBatchOptions value) : IOptionsMonitor<LlmBatchOptions>
    {
        public LlmBatchOptions CurrentValue => value;
        public LlmBatchOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<LlmBatchOptions, string?> listener) => null;
    }

    private sealed class BatchRouting : ILlmBatchRoutingContext
    {
        public bool UseBatchPath => true;
    }

    private sealed class BatchClient(Func<BatchChatCompletionItem, BatchChatCompletionResult> complete) : IBatchAgentCompletionClient
    {
        public Task<(IReadOnlyList<BatchChatCompletionResult> Results, BatchAgentCompletionRunSummary Summary)> RunChatCompletionsBatchAsync(
            IReadOnlyList<BatchChatCompletionItem> requests, CancellationToken cancellationToken) =>
            Task.FromResult<(IReadOnlyList<BatchChatCompletionResult>, BatchAgentCompletionRunSummary)>(
                ([complete(Assert.Single(requests))], new BatchAgentCompletionRunSummary { BatchJobId = "test", RequestCount = 1 }));
    }

    private sealed class CompletionClient(Func<CancellationToken, Task<string>> complete) : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");
        public Task<string> CompleteJsonAsync(string systemPrompt, string userPrompt, int? maxTokens = null,
            float? temperature = null, CancellationToken cancellationToken = default) => complete(cancellationToken);
    }

    private sealed class Router(IAgentCompletionClient client) : IAgentTierCompletionRouter
    {
        public int Calls { get; private set; }
        public IAgentCompletionClient DefaultCompletionClient => client;
        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
            AgentType agentType, LlmModelTier? taskTierOverride)
        {
            Calls++;
            return (client, LlmModelTier.Economy);
        }
        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgentTypeName(
            string agentTypeName, LlmModelTier? taskTierOverride) => (client, LlmModelTier.Economy);
    }
}
