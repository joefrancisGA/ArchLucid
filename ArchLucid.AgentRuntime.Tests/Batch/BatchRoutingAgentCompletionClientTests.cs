using ArchLucid.AgentRuntime.Batch;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Batch;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BatchRoutingAgentCompletionClientTests
{
    [Fact]
    public async Task CompleteJsonAsync_uses_inner_when_batch_disabled()
    {
        Mock<IAgentCompletionClient> inner = new();
        inner.Setup(c => c.CompleteJsonAsync("sys", "user", null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("sync-result");

        Mock<IBatchAgentCompletionClient> batch = new();
        Mock<IOptionsMonitor<LlmBatchOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new LlmBatchOptions { Enabled = false });

        BatchRoutingAgentCompletionClient sut = new(
            inner.Object,
            batch.Object,
            options.Object,
            LlmBatchRoutingContext.Instance,
            NullLogger<BatchRoutingAgentCompletionClient>.Instance,
            static _ => true);

        using (LlmBatchRoutingContext.BeginOfflineBatchPath())
        {
            string result = await sut.CompleteJsonAsync("sys", "user");

            result.Should().Be("sync-result");
        }

        batch.Verify(
            b => b.RunChatCompletionsBatchAsync(It.IsAny<IReadOnlyList<BatchChatCompletionItem>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompleteJsonAsync_uses_batch_when_offline_path_enabled()
    {
        Mock<IAgentCompletionClient> inner = new();
        Mock<IBatchAgentCompletionClient> batch = new();
        batch.Setup(b => b.RunChatCompletionsBatchAsync(It.IsAny<IReadOnlyList<BatchChatCompletionItem>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                (IReadOnlyList<BatchChatCompletionResult>)
                [
                    new BatchChatCompletionResult
                    {
                        CustomId = "x",
                        AssistantText = "batch-result",
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
            RouteOfflineFaithfulnessJudge = true,
        });

        BatchRoutingAgentCompletionClient sut = new(
            inner.Object,
            batch.Object,
            options.Object,
            LlmBatchRoutingContext.Instance,
            NullLogger<BatchRoutingAgentCompletionClient>.Instance,
            static opts => opts.RouteOfflineFaithfulnessJudge);

        using (LlmBatchRoutingContext.BeginOfflineBatchPath())
        {
            string result = await sut.CompleteJsonAsync("sys", "user");

            result.Should().Be("batch-result");
        }
    }
}
