using ArchLucid.AgentRuntime.Batch;

using FluentAssertions;

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
}
