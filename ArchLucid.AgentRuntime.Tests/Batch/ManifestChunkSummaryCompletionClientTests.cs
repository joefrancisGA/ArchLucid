using ArchLucid.AgentRuntime.Batch;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Batch;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ManifestChunkSummaryCompletionClientTests
{
    [Fact]
    public async Task SummarizeChunkAsync_uses_sync_when_manifest_batch_enabled_without_offline_path()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), 400, 0.1f, It.IsAny<CancellationToken>()))
            .ReturnsAsync("sync-summary");

        Mock<IAgentTierCompletionRouter> router = new();
        router.Setup(r => r.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy))
            .Returns((completionClient.Object, LlmModelTier.Economy));

        Mock<IBatchAgentCompletionClient> batch = new();
        Mock<IOptionsMonitor<LlmBatchOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new LlmBatchOptions
        {
            Enabled = true,
            RouteManifestSummarization = true,
        });

        ManifestChunkSummaryCompletionClient sut = new(
            router.Object,
            batch.Object,
            options.Object,
            LlmBatchRoutingContext.Instance,
            NullLogger<ManifestChunkSummaryCompletionClient>.Instance);

        string result = await sut.SummarizeChunkAsync("manifest chunk text", CancellationToken.None);

        result.Should().Be("sync-summary");
        batch.Verify(
            b => b.RunChatCompletionsBatchAsync(It.IsAny<IReadOnlyList<BatchChatCompletionItem>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SummarizeChunkAsync_uses_batch_when_offline_path_enabled()
    {
        Mock<IAgentCompletionClient> completionClient = new();
        Mock<IAgentTierCompletionRouter> router = new();
        router.Setup(r => r.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy))
            .Returns((completionClient.Object, LlmModelTier.Economy));

        Mock<IBatchAgentCompletionClient> batch = new();
        batch.Setup(b => b.RunChatCompletionsBatchAsync(It.IsAny<IReadOnlyList<BatchChatCompletionItem>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                (IReadOnlyList<BatchChatCompletionResult>)
                [
                    new BatchChatCompletionResult
                    {
                        CustomId = "x",
                        AssistantText = "batch-summary",
                        PromptTokens = 1,
                        CompletionTokens = 2,
                    },
                ],
                new BatchAgentCompletionRunSummary
                {
                    BatchJobId = "batch-1",
                    RequestCount = 1,
                    EstimatedSavingsUsd = 0.01,
                }));

        Mock<IOptionsMonitor<LlmBatchOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new LlmBatchOptions
        {
            Enabled = true,
            RouteManifestSummarization = true,
        });

        ManifestChunkSummaryCompletionClient sut = new(
            router.Object,
            batch.Object,
            options.Object,
            LlmBatchRoutingContext.Instance,
            NullLogger<ManifestChunkSummaryCompletionClient>.Instance);

        using (LlmBatchRoutingContext.BeginOfflineBatchPath())
        {
            string result = await sut.SummarizeChunkAsync("manifest chunk text", CancellationToken.None);

            result.Should().Be("batch-summary");
        }
    }
}
