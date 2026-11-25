using System.Text.Json;

using ArchLucid.AgentRuntime.Batch;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Batch;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureOpenAiBatchCompletionClientJsonTests
{
    [Fact]
    public void BuildRequestJsonl_emits_deployment_name_and_custom_ids()
    {
        IReadOnlyList<BatchChatCompletionItem> requests =
        [
            new BatchChatCompletionItem("req-1", "system-a", "user-a") { MaxTokens = 128, Temperature = 0.2f },
            new BatchChatCompletionItem("req-2", "system-b", "user-b"),
        ];

        string jsonl = AzureOpenAiBatchCompletionClient.BuildRequestJsonl("economy-deployment", requests);

        jsonl.Should().Contain("\"custom_id\":\"req-1\"");
        jsonl.Should().Contain("\"custom_id\":\"req-2\"");
        jsonl.Should().Contain("\"model\":\"economy-deployment\"");
        jsonl.Should().Contain("\"max_completion_tokens\":128");
        jsonl.Should().Contain("system-a");
        jsonl.Should().Contain("user-b");
    }

    [Fact]
    public void ParseOutputJsonl_maps_assistant_text_and_usage()
    {
        const string jsonl = """
            {"custom_id":"req-1","response":{"status_code":200,"body":{"choices":[{"message":{"content":"{\"ok\":true}"}}],"usage":{"prompt_tokens":12,"completion_tokens":8}}}}
            """;

        IReadOnlyList<BatchChatCompletionResult> results =
            AzureOpenAiBatchCompletionClient.ParseOutputJsonl(jsonl);

        results.Should().HaveCount(1);
        results[0].CustomId.Should().Be("req-1");
        results[0].AssistantText.Should().Contain("ok");
        results[0].PromptTokens.Should().Be(12);
        results[0].CompletionTokens.Should().Be(8);
    }

    [Fact]
    public async Task RunChatCompletionsBatchAsync_aligns_out_of_order_results_by_custom_id()
    {
        Mock<IAzureOpenAiBatchTransport> transport = CompletedJob(
            OutputLine("req-2", "{\"second\":true}") + "\n" + OutputLine("req-1", "{\"first\":true}"));
        AzureOpenAiBatchCompletionClient client = CreateClient(transport.Object);

        (IReadOnlyList<BatchChatCompletionResult> results, BatchAgentCompletionRunSummary summary) =
            await client.RunChatCompletionsBatchAsync(
                [Request("req-1"), Request("req-2")], CancellationToken.None);

        results.Select(result => result.CustomId).Should().Equal("req-1", "req-2");
        results.Select(result => result.AssistantText).Should().Equal("{\"first\":true}", "{\"second\":true}");
        summary.RequestCount.Should().Be(2);
    }

    [Theory]
    [InlineData("req-1,req-1", "duplicate")]
    [InlineData("req-1,other", "unexpected")]
    [InlineData("req-1", "missing")]
    public async Task RunChatCompletionsBatchAsync_rejects_unmatchable_results(string ids, string reason)
    {
        string jsonl = string.Join("\n", ids.Split(',').Select(id => OutputLine(id, "{}")));
        AzureOpenAiBatchCompletionClient client = CreateClient(CompletedJob(jsonl).Object);

        InvalidOperationException failure = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.RunChatCompletionsBatchAsync([Request("req-1"), Request("req-2")], CancellationToken.None));

        Assert.Contains(reason, failure.Message);
    }

    [Fact]
    public async Task RunChatCompletionsBatchAsync_rejects_duplicate_request_ids_before_upload()
    {
        Mock<IAzureOpenAiBatchTransport> transport = CompletedJob(OutputLine("req-1", "{}"));
        AzureOpenAiBatchCompletionClient client = CreateClient(transport.Object);

        ArgumentException failure = await Assert.ThrowsAsync<ArgumentException>(() =>
            client.RunChatCompletionsBatchAsync([Request("req-1"), Request("req-1")], CancellationToken.None));

        Assert.Equal("requests", failure.ParamName);
        transport.Verify(t => t.UploadBatchInputFileAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("cancelled")]
    [InlineData("canceled")]
    public async Task RunChatCompletionsBatchAsync_treats_cancelled_status_as_terminal(string status)
    {
        Mock<IAzureOpenAiBatchTransport> transport = CompletedJob(string.Empty, status);
        Mock<TimeProvider> clock = new();
        clock.SetupSequence(provider => provider.GetUtcNow())
            .Returns(DateTimeOffset.UnixEpoch)
            .Returns(DateTimeOffset.UnixEpoch.AddHours(3));
        AzureOpenAiBatchCompletionClient client = CreateClient(transport.Object, clock.Object);

        InvalidOperationException failure = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.RunChatCompletionsBatchAsync([Request("req-1")], CancellationToken.None));

        Assert.Contains($"status '{status}'", failure.Message);
        transport.Verify(t => t.GetBatchStatusAsync("job", It.IsAny<CancellationToken>()), Times.Once);
        transport.Verify(t => t.GetBatchOutputFileIdAsync("job", It.IsAny<CancellationToken>()), Times.Never);
    }

    private static BatchChatCompletionItem Request(string id) => new(id, "system", "user");

    private static string OutputLine(string id, string content) =>
        JsonSerializer.Serialize(new
        {
            custom_id = id,
            response = new { body = new { choices = new[] { new { message = new { content } } } } },
        });

    private static Mock<IAzureOpenAiBatchTransport> CompletedJob(string output, string status = "completed")
    {
        Mock<IAzureOpenAiBatchTransport> transport = new(MockBehavior.Strict);
        transport.Setup(t => t.UploadBatchInputFileAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("input");
        transport.Setup(t => t.CreateBatchJobAsync("input", It.IsAny<CancellationToken>()))
            .ReturnsAsync("job");
        transport.Setup(t => t.GetBatchStatusAsync("job", It.IsAny<CancellationToken>()))
            .ReturnsAsync(status);
        transport.Setup(t => t.GetBatchOutputFileIdAsync("job", It.IsAny<CancellationToken>()))
            .ReturnsAsync("output");
        transport.Setup(t => t.DownloadFileContentAsync("output", It.IsAny<CancellationToken>()))
            .ReturnsAsync(output);
        return transport;
    }

    private static AzureOpenAiBatchCompletionClient CreateClient(
        IAzureOpenAiBatchTransport transport, TimeProvider? timeProvider = null)
    {
        Mock<IOptionsMonitor<LlmBatchOptions>> options = new();
        options.SetupGet(monitor => monitor.CurrentValue).Returns(new LlmBatchOptions());
        return new AzureOpenAiBatchCompletionClient(
            transport, "batch-model", options.Object, Mock.Of<ILlmCostEstimator>(),
            timeProvider ?? TimeProvider.System, NullLogger<AzureOpenAiBatchCompletionClient>.Instance);
    }
}
